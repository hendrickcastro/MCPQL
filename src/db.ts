import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER as string,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: ['true', 'yes'].includes((process.env.DB_ENCRYPT || 'false').toLowerCase()),
    trustServerCertificate: ['true', 'yes'].includes((process.env.DB_TRUST_SERVER_CERTIFICATE || 'false').toLowerCase()),
  },
  connectionTimeout: Number(process.env.DB_TIMEOUT) || 30000,
  requestTimeout: Number(process.env.DB_TIMEOUT) || 30000,
};

// Track connection state
let pool: sql.ConnectionPool | null = null;
let isConnecting = false;
let connectionPromise: Promise<sql.ConnectionPool> | null = null;

// Improved connection function with proper state management
export const connectDB = async (): Promise<sql.ConnectionPool> => {
  try {
    // If already connected, return the pool
    if (pool) {
      return pool;
    }
    
    // If connection is in progress, wait for it
    if (isConnecting && connectionPromise) {
      return await connectionPromise;
    }
    
    // Start a new connection
    isConnecting = true;
    connectionPromise = new sql.ConnectionPool(config).connect();
    
    // Wait for connection and update state
    pool = await connectionPromise;
    isConnecting = false;
    
    // Connection event handlers to manage state
    pool.on('error', (err) => {
      console.error('SQL connection pool error:', err);
      // Don't reset pool here, let reconnection happen on next call
    });
    
    return pool;
  } catch (err) {
    isConnecting = false;
    connectionPromise = null;
    pool = null;
    console.error('Database connection failed:', err);
    throw err;
  }
};

// Get the current pool or throw a clear error
export const getPool = (): sql.ConnectionPool => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return pool;
};

// Explicitly close the connection if needed
export const closePool = async (): Promise<void> => {
  if (pool) {
    try {
      await pool.close();
      console.log('SQL Server connection closed');
    } catch (err) {
      console.error('Error closing SQL connection:', err);
    } finally {
      pool = null;
      isConnecting = false;
      connectionPromise = null;
    }
  }
}
