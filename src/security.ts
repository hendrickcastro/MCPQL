import dotenv from 'dotenv';

dotenv.config();

// Helper function to parse boolean values
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
};

// Security configuration
export const SECURITY_CONFIG = {
  ALLOW_MODIFICATIONS: parseBoolean(process.env.DB_ALLOW_MODIFICATIONS, false),
  ALLOW_STORED_PROCEDURES: parseBoolean(process.env.DB_ALLOW_STORED_PROCEDURES, false)
};

// SQL keywords that indicate modification operations
const MODIFICATION_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
  'TRUNCATE', 'MERGE', 'BULK', 'EXEC', 'EXECUTE'
];

// SQL keywords that are safe for read-only operations
const SAFE_KEYWORDS = [
  'SELECT', 'WITH', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL',
  'GROUP', 'ORDER', 'HAVING', 'UNION', 'INTERSECT', 'EXCEPT', 'CASE', 'WHEN'
];

/**
 * Check if a SQL query contains modification operations
 */
export function containsModificationOperations(query: string): boolean {
  if (!query) return false;
  
  // Remove comments and normalize whitespace
  const cleanQuery = query
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toUpperCase();

  // Check for modification keywords
  return MODIFICATION_KEYWORDS.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(cleanQuery);
  });
}

/**
 * Validate if modifications are allowed
 */
export function validateModificationPermission(operation: string): { allowed: boolean; message?: string } {
  if (!SECURITY_CONFIG.ALLOW_MODIFICATIONS) {
    return {
      allowed: false,
      message: `[X] OPERATION BLOCKED: Database modifications are disabled for security.

[*] REQUESTED OPERATION: ${operation}

[+] TO ENABLE MODIFICATIONS:
Configure the environment variable: DB_ALLOW_MODIFICATIONS=true

[!] WARNING: Only enable modifications if you are sure it is safe to do so.
In production environments, keep this setting as 'false' to prevent accidental changes.

[#] CURRENT CONFIGURATION:
- DB_ALLOW_MODIFICATIONS: ${SECURITY_CONFIG.ALLOW_MODIFICATIONS}
- DB_ALLOW_STORED_PROCEDURES: ${SECURITY_CONFIG.ALLOW_STORED_PROCEDURES}`
    };
  }
  
  return { allowed: true };
}

/**
 * Validate if stored procedure execution is allowed
 */
export function validateStoredProcedurePermission(spName: string): { allowed: boolean; message?: string } {
  if (!SECURITY_CONFIG.ALLOW_STORED_PROCEDURES) {
    return {
      allowed: false,
      message: `[X] EXECUTION BLOCKED: Stored procedure execution is disabled for security.

[*] REQUESTED STORED PROCEDURE: ${spName}

[+] TO ENABLE STORED PROCEDURES:
Configure the environment variable: DB_ALLOW_STORED_PROCEDURES=true

[!] WARNING: Stored procedures can perform database modifications.
Only enable this function if you are sure it is safe to do so.

[#] CURRENT CONFIGURATION:
- DB_ALLOW_MODIFICATIONS: ${SECURITY_CONFIG.ALLOW_MODIFICATIONS}
- DB_ALLOW_STORED_PROCEDURES: ${SECURITY_CONFIG.ALLOW_STORED_PROCEDURES}

[i] SAFE ALTERNATIVE:
You can use 'mcp_sp_structure' to analyze the stored procedure without executing it.`
    };
  }
  
  return { allowed: true };
}

/**
 * Validate if a SQL query is allowed to execute
 */
export function validateQueryPermission(query: string): { allowed: boolean; message?: string } {
  if (!query) {
    return { allowed: false, message: 'Empty or invalid query' };
  }

  const hasModifications = containsModificationOperations(query);
  
  if (hasModifications) {
    return validateModificationPermission(`SQL Query: ${query.substring(0, 100)}...`);
  }
  
  return { allowed: true };
}

/**
 * Get current security status
 */
export function getSecurityStatus(): {
  modifications_enabled: boolean;
  stored_procedures_enabled: boolean;
  security_level: string;
  recommendations: string[];
} {
  const modifications = SECURITY_CONFIG.ALLOW_MODIFICATIONS;
  const storedProcs = SECURITY_CONFIG.ALLOW_STORED_PROCEDURES;
  
  let securityLevel = 'MAXIMUM';
  let recommendations: string[] = [];
  
  if (modifications && storedProcs) {
    securityLevel = 'LOW';
    recommendations.push('[!] Consider disabling modifications in production');
    recommendations.push('[!] Consider disabling stored procedures in production');
  } else if (modifications || storedProcs) {
    securityLevel = 'MEDIUM';
    if (modifications) {
      recommendations.push('[!] Modifications are enabled - use with caution');
    }
    if (storedProcs) {
      recommendations.push('[!] Stored procedures are enabled - use with caution');
    }
  } else {
    recommendations.push('[OK] Optimal security configuration for production');
  }
  
  return {
    modifications_enabled: modifications,
    stored_procedures_enabled: storedProcs,
    security_level: securityLevel,
    recommendations
  };
}