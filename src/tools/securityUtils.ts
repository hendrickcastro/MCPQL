import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SQL operations that require user confirmation
 */
export const WRITE_OPERATIONS = [
  'INSERT', 'UPDATE', 'DELETE', 'ALTER', 'DROP', 'TRUNCATE', 
  'CREATE', 'MERGE', 'BULK', 'EXEC', 'EXECUTE'
];

/**
 * SQL operations that are read-only and don't require confirmation
 */
export const READ_OPERATIONS = [
  'SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN', 'WITH'
];

/**
 * Analyze SQL query to determine if it requires user confirmation
 */
export function analyzeQuery(sql: string): {
  requiresConfirmation: boolean;
  operation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
} {
  // Clean and normalize the SQL
  const cleanSql = sql.trim().toUpperCase();
  
  // Extract the first meaningful SQL keyword
  const firstKeyword = cleanSql.split(/\s+/)[0];
  
  // Check for write operations
  const isWriteOperation = WRITE_OPERATIONS.some(op => cleanSql.startsWith(op));
  
  if (isWriteOperation) {
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    let reason = `Detected ${firstKeyword} operation which modifies data`;
    
    // Determine risk level
    if (firstKeyword === 'DELETE' || firstKeyword === 'DROP' || firstKeyword === 'TRUNCATE') {
      riskLevel = 'HIGH';
      reason = `High-risk ${firstKeyword} operation that can permanently remove data`;
    } else if (firstKeyword === 'ALTER') {
      riskLevel = 'HIGH';
      reason = `Schema modification operation that can affect database structure`;
    } else if (firstKeyword === 'UPDATE') {
      riskLevel = 'MEDIUM';
      reason = `Data modification operation that updates existing records`;
    } else if (firstKeyword === 'INSERT') {
      riskLevel = 'LOW';
      reason = `Data insertion operation that adds new records`;
    }
    
    return {
      requiresConfirmation: true,
      operation: firstKeyword,
      riskLevel,
      reason
    };
  }
  
  // Check for read operations
  const isReadOperation = READ_OPERATIONS.some(op => cleanSql.startsWith(op));
  
  if (isReadOperation) {
    return {
      requiresConfirmation: false,
      operation: firstKeyword,
      riskLevel: 'LOW',
      reason: `Read-only ${firstKeyword} operation`
    };
  }
  
  // Unknown operation - err on the side of caution
  return {
    requiresConfirmation: true,
    operation: firstKeyword || 'UNKNOWN',
    riskLevel: 'HIGH',
    reason: `Unknown SQL operation - requires confirmation for safety`
  };
}

/**
 * Estimate the impact of a write operation
 */
export async function estimateImpact(sql: string, pool: any): Promise<{
  estimatedRows: number;
  affectedTables: string[];
  warning?: string;
}> {
  try {
    const cleanSql = sql.trim().toUpperCase();
    const affectedTables: string[] = [];
    let estimatedRows = 0;
    
    // Extract table names from common patterns
    const tableMatches = sql.match(/(?:FROM|UPDATE|INTO|JOIN)\s+(\[?\w+\]?\.?\[?\w+\]?)/gi);
    if (tableMatches) {
      tableMatches.forEach(match => {
        const tableName = match.replace(/^(FROM|UPDATE|INTO|JOIN)\s+/i, '').trim();
        if (!affectedTables.includes(tableName)) {
          affectedTables.push(tableName);
        }
      });
    }
    
    // For DELETE and UPDATE operations, try to estimate affected rows
    if (cleanSql.startsWith('DELETE') || cleanSql.startsWith('UPDATE')) {
      // Try to convert to a SELECT COUNT(*) to estimate impact
      let countQuery = '';
      
      if (cleanSql.startsWith('DELETE')) {
        countQuery = sql.replace(/^DELETE\s+/i, 'SELECT COUNT(*) AS estimated_rows ');
      } else if (cleanSql.startsWith('UPDATE')) {
        // Extract the FROM clause and WHERE clause for UPDATE
        const fromMatch = sql.match(/UPDATE\s+(\[?\w+\]?\.?\[?\w+\]?)(?:\s+SET.*?)(\s+WHERE.*)?$/i);
        if (fromMatch) {
          const tableName = fromMatch[1];
          const whereClause = fromMatch[2] || '';
          countQuery = `SELECT COUNT(*) AS estimated_rows FROM ${tableName}${whereClause}`;
        }
      }
      
      if (countQuery) {
        try {
          const result = await pool.request().query(countQuery);
          estimatedRows = result.recordset[0]?.estimated_rows || 0;
        } catch (error) {
          // If estimation fails, we'll return 0 with a warning
          return {
            estimatedRows: 0,
            affectedTables,
            warning: 'Could not estimate the number of affected rows'
          };
        }
      }
    }
    
    return {
      estimatedRows,
      affectedTables,
      warning: estimatedRows > 1000 ? 'Large number of rows may be affected' : undefined
    };
  } catch (error) {
    return {
      estimatedRows: 0,
      affectedTables: [],
      warning: 'Impact estimation failed'
    };
  }
}

/**
 * Log security events to a dedicated security log file
 */
export function logSecurityEvent(event: {
  timestamp: Date;
  operation: string;
  sql: string;
  riskLevel: string;
  userConfirmed: boolean;
  estimatedRows?: number;
  affectedTables?: string[];
  result?: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  error?: string;
}) {
  try {
    const logFile = path.join(__dirname, '..', '..', 'security_audit.log');
    const logEntry = {
      timestamp: event.timestamp.toISOString(),
      operation: event.operation,
      sql: event.sql.substring(0, 500), // Truncate long SQL for logging
      riskLevel: event.riskLevel,
      userConfirmed: event.userConfirmed,
      estimatedRows: event.estimatedRows,
      affectedTables: event.affectedTables,
      result: event.result,
      error: event.error
    };
    
    const logMessage = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.error('Failed to write security log:', error);
  }
}

/**
 * Create a confirmation prompt for the user
 */
export function createConfirmationPrompt(analysis: {
  operation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
}, impact: {
  estimatedRows: number;
  affectedTables: string[];
  warning?: string;
}): string {
  const riskEmoji = {
    'LOW': '🟡',
    'MEDIUM': '🟠', 
    'HIGH': '🔴'
  };
  
  let prompt = `${riskEmoji[analysis.riskLevel]} SECURITY CONFIRMATION REQUIRED\n\n`;
  prompt += `Operation: ${analysis.operation}\n`;
  prompt += `Risk Level: ${analysis.riskLevel}\n`;
  prompt += `Reason: ${analysis.reason}\n\n`;
  
  if (impact.estimatedRows > 0) {
    prompt += `Estimated affected rows: ${impact.estimatedRows}\n`;
  }
  
  if (impact.affectedTables.length > 0) {
    prompt += `Affected tables: ${impact.affectedTables.join(', ')}\n`;
  }
  
  if (impact.warning) {
    prompt += `⚠️  Warning: ${impact.warning}\n`;
  }
  
  prompt += `\nThis operation will modify your database. Do you want to proceed?\n`;
  prompt += `Please confirm by responding with 'YES' to continue or 'NO' to cancel.`;
  
  return prompt;
}

/**
 * Pending operations storage (in-memory for simplicity)
 * In production, this should be stored in a database or persistent storage
 */
const pendingOperations = new Map<string, {
  sql: string;
  operation: string;
  riskLevel: string;
  timestamp: Date;
  estimatedRows: number;
  affectedTables: string[];
  spName?: string;
  params?: any;
}>();

/**
 * Generate a unique confirmation token
 */
export function generateConfirmationToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CONF_${timestamp}_${random}`.toUpperCase();
}

/**
 * Store a pending operation with its token
 */
export function storePendingOperation(token: string, operation: {
  sql: string;
  operation: string;
  riskLevel: string;
  estimatedRows: number;
  affectedTables: string[];
  spName?: string;
  params?: any;
}): void {
  pendingOperations.set(token, {
    ...operation,
    timestamp: new Date()
  });
  
  // Clean up expired tokens (older than 5 minutes)
  cleanupExpiredTokens();
}

/**
 * Retrieve and validate a pending operation by token
 */
export function getPendingOperation(token: string): {
  sql: string;
  operation: string;
  riskLevel: string;
  estimatedRows: number;
  affectedTables: string[];
  spName?: string;
  params?: any;
} | null {
  const operation = pendingOperations.get(token);
  
  if (!operation) {
    return null;
  }
  
  // Check if token has expired (5 minutes)
  const now = new Date();
  const tokenAge = now.getTime() - operation.timestamp.getTime();
  const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  if (tokenAge > maxAge) {
    pendingOperations.delete(token);
    return null;
  }
  
  return operation;
}

/**
 * Remove a pending operation after execution
 */
export function removePendingOperation(token: string): void {
  pendingOperations.delete(token);
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [token, operation] of pendingOperations.entries()) {
    const tokenAge = now.getTime() - operation.timestamp.getTime();
    if (tokenAge > maxAge) {
      pendingOperations.delete(token);
    }
  }
}

/**
 * Create a security confirmation message with token
 */
export function createSecurityConfirmationMessage(
  analysis: {
    operation: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
  },
  impact: {
    estimatedRows: number;
    affectedTables: string[];
    warning?: string;
  },
  token: string,
  sql?: string,
  spName?: string,
  params?: any
): string {
  const riskEmoji = {
    'LOW': '🟡',
    'MEDIUM': '🟠', 
    'HIGH': '🔴'
  };
  
  let message = `${riskEmoji[analysis.riskLevel]} OPERACIÓN REQUIERE CONFIRMACIÓN DE SEGURIDAD\n\n`;
  message += `Operación: ${analysis.operation}\n`;
  message += `Nivel de Riesgo: ${analysis.riskLevel}\n`;
  message += `Motivo: ${analysis.reason}\n\n`;
  
  if (spName) {
    message += `Procedimiento: ${spName}\n`;
    if (params && Object.keys(params).length > 0) {
      message += `Parámetros: ${JSON.stringify(params, null, 2)}\n`;
    }
  }
  
  if (sql) {
    message += `SQL: ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}\n\n`;
  }
  
  if (impact.estimatedRows > 0) {
    message += `Registros estimados afectados: ${impact.estimatedRows}\n`;
  }
  
  if (impact.affectedTables.length > 0) {
    message += `Tablas afectadas: ${impact.affectedTables.join(', ')}\n`;
  }
  
  if (impact.warning) {
    message += `⚠️  Advertencia: ${impact.warning}\n`;
  }
  
  message += `\n🔐 PARA CONFIRMAR Y EJECUTAR:\n`;
  message += `Use la herramienta: mcp_confirm_and_execute\n`;
  message += `Con el token: ${token}\n\n`;
  message += `⏰ Este token expira en 5 minutos por seguridad.\n`;
  message += `❌ La operación NO se ha ejecutado aún.`;
  
  return message;
}