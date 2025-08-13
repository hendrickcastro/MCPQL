import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();
// Helper function to parse boolean values
const parseBoolean = (value, defaultValue = false) => {
    if (!value)
        return defaultValue;
    return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
};
// Helper function to build server string with instance name
const buildServerString = () => {
    const server = process.env.DB_SERVER;
    const instance = process.env.DB_INSTANCE_NAME;
    if (instance) {
        return `${server}\\${instance}`;
    }
    return server;
};
// Build configuration based on authentication type
const buildConfig = () => {
    const authenticationType = (process.env.DB_AUTHENTICATION_TYPE || 'sql').toLowerCase();
    const server = buildServerString();
    const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
    // Base configuration
    const baseConfig = {
        server,
        database: process.env.DB_NAME,
        connectionTimeout: Number(process.env.DB_TIMEOUT) || 30000,
        requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT) || 30000,
        pool: {
            max: Number(process.env.DB_POOL_MAX) || 10,
            min: Number(process.env.DB_POOL_MIN) || 0,
            idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
        },
        options: {
            encrypt: parseBoolean(process.env.DB_ENCRYPT, false),
            trustServerCertificate: parseBoolean(process.env.DB_TRUST_SERVER_CERTIFICATE, false),
            enableArithAbort: parseBoolean(process.env.DB_ENABLE_ARITH_ABORT, true),
            cancelTimeout: Number(process.env.DB_CANCEL_TIMEOUT) || 5000,
            packetSize: Number(process.env.DB_PACKET_SIZE) || 4096,
            useUTC: parseBoolean(process.env.DB_USE_UTC, true),
        },
    };
    // Add port if specified
    if (port) {
        baseConfig.port = port;
    }
    // Configure authentication based on type
    switch (authenticationType) {
        case 'sql':
            return {
                ...baseConfig,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
            };
        case 'windows':
            const domain = process.env.DB_DOMAIN;
            const userName = process.env.DB_USER;
            const password = process.env.DB_PASSWORD;
            if (!domain) {
                throw new Error('DB_DOMAIN is required for Windows authentication');
            }
            return {
                ...baseConfig,
                domain,
                authentication: {
                    type: 'ntlm',
                    options: {
                        domain,
                        userName: userName || '',
                        password: password || '',
                    },
                },
            };
        case 'azure-ad':
            // Azure SQL Database specific settings
            const azureConfig = {
                ...baseConfig,
                options: {
                    ...baseConfig.options,
                    encrypt: true, // Always true for Azure
                    trustServerCertificate: false, // Always false for Azure
                },
            };
            // Check if using Azure AD Service Principal
            if (process.env.DB_AZURE_CLIENT_ID && process.env.DB_AZURE_CLIENT_SECRET) {
                const tenantId = process.env.DB_AZURE_TENANT_ID;
                if (!tenantId) {
                    throw new Error('DB_AZURE_TENANT_ID is required for Azure AD Service Principal authentication');
                }
                return {
                    ...azureConfig,
                    authentication: {
                        type: 'azure-active-directory-service-principal-secret',
                        options: {
                            clientId: process.env.DB_AZURE_CLIENT_ID,
                            clientSecret: process.env.DB_AZURE_CLIENT_SECRET,
                            tenantId,
                        },
                    },
                };
            }
            // Fallback to Azure AD Password (requires user/password)
            const azureUser = process.env.DB_USER;
            const azurePassword = process.env.DB_PASSWORD;
            if (!azureUser || !azurePassword) {
                throw new Error('DB_USER and DB_PASSWORD are required for Azure AD Password authentication');
            }
            return {
                ...azureConfig,
                user: azureUser,
                password: azurePassword,
            };
        default:
            throw new Error(`Unsupported authentication type: ${authenticationType}`);
    }
};
// Use connection string if provided, otherwise build config
const getConnectionConfig = () => {
    const connectionString = process.env.DB_CONNECTION_STRING;
    if (connectionString) {
        console.log('Using provided connection string');
        return { connectionString };
    }
    return { config: buildConfig() };
};
const { config, connectionString } = getConnectionConfig();
// Track connection state
let pool = null;
let isConnecting = false;
let connectionPromise = null;
// Improved connection function with proper state management
export const connectDB = async () => {
    try {
        // If already connected, return the pool
        if (pool && pool.connected) {
            return pool;
        }
        // If connection is in progress, wait for it
        if (isConnecting && connectionPromise) {
            return await connectionPromise;
        }
        // Start a new connection
        isConnecting = true;
        console.log('Connecting to SQL Server...');
        // Create connection promise based on configuration type
        if (connectionString) {
            connectionPromise = new sql.ConnectionPool(connectionString).connect();
        }
        else if (config) {
            connectionPromise = new sql.ConnectionPool(config).connect();
        }
        else {
            throw new Error('No valid configuration found');
        }
        // Wait for connection and update state
        pool = await connectionPromise;
        isConnecting = false;
        console.log('Successfully connected to SQL Server');
        // Connection event handlers to manage state
        pool.on('error', (err) => {
            console.error('SQL connection pool error:', err);
            // Reset connection state on error
            pool = null;
            isConnecting = false;
            connectionPromise = null;
        });
        pool.on('close', () => {
            console.log('SQL connection pool closed');
            pool = null;
            isConnecting = false;
            connectionPromise = null;
        });
        return pool;
    }
    catch (err) {
        isConnecting = false;
        connectionPromise = null;
        pool = null;
        // Enhanced error logging
        console.error('Database connection failed:', err);
        // Provide helpful error messages based on common issues
        if (err instanceof Error) {
            const errorMessage = err.message.toLowerCase();
            if (errorMessage.includes('login failed')) {
                console.error(' Tip: Check your username and password. For Windows Authentication, ensure DB_AUTHENTICATION_TYPE=windows');
            }
            else if (errorMessage.includes('server was not found')) {
                console.error(' Tip: Check your server name and port. For SQL Server Express, you might need DB_INSTANCE_NAME');
            }
            else if (errorMessage.includes('certificate')) {
                console.error(' Tip: For local development, try setting DB_TRUST_SERVER_CERTIFICATE=true');
            }
            else if (errorMessage.includes('timeout')) {
                console.error(' Tip: Try increasing DB_TIMEOUT or check your network connection');
            }
        }
        throw err;
    }
};
// Get the current pool or throw a clear error
export const getPool = () => {
    if (!pool || !pool.connected) {
        throw new Error('Database not connected. Call connectDB first.');
    }
    return pool;
};
// Test the connection
export const testConnection = async () => {
    try {
        const testPool = await connectDB();
        const request = testPool.request();
        await request.query('SELECT 1 as test');
        console.log(' Database connection test successful');
        return true;
    }
    catch (err) {
        console.error(' Database connection test failed:', err);
        return false;
    }
};
// Explicitly close the connection if needed
export const closePool = async () => {
    if (pool) {
        try {
            await pool.close();
            console.log('SQL Server connection closed');
        }
        catch (err) {
            console.error('Error closing SQL connection:', err);
        }
        finally {
            pool = null;
            isConnecting = false;
            connectionPromise = null;
        }
    }
};
// Export configuration info for debugging
export const getConfigInfo = () => {
    const authenticationType = process.env.DB_AUTHENTICATION_TYPE || 'sql';
    const server = buildServerString();
    return {
        authenticationType,
        server,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        encrypt: parseBoolean(process.env.DB_ENCRYPT, false),
        trustServerCertificate: parseBoolean(process.env.DB_TRUST_SERVER_CERTIFICATE, false),
        usingConnectionString: !!process.env.DB_CONNECTION_STRING,
    };
};
