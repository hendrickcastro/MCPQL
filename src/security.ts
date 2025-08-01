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
      message: `🚫 OPERACIÓN BLOQUEADA: Las modificaciones en la base de datos están deshabilitadas por seguridad.

📋 OPERACIÓN SOLICITADA: ${operation}

🔧 PARA HABILITAR MODIFICACIONES:
Configura la variable de entorno: DB_ALLOW_MODIFICATIONS=true

⚠️  ADVERTENCIA: Solo habilita modificaciones si estás seguro de que es seguro hacerlo.
En entornos de producción, mantén esta configuración en 'false' para prevenir cambios accidentales.

🔒 CONFIGURACIÓN ACTUAL:
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
      message: `🚫 EJECUCIÓN BLOQUEADA: La ejecución de stored procedures está deshabilitada por seguridad.

📋 STORED PROCEDURE SOLICITADO: ${spName}

🔧 PARA HABILITAR STORED PROCEDURES:
Configura la variable de entorno: DB_ALLOW_STORED_PROCEDURES=true

⚠️  ADVERTENCIA: Los stored procedures pueden realizar modificaciones en la base de datos.
Solo habilita esta función si estás seguro de que es seguro hacerlo.

🔒 CONFIGURACIÓN ACTUAL:
- DB_ALLOW_MODIFICATIONS: ${SECURITY_CONFIG.ALLOW_MODIFICATIONS}
- DB_ALLOW_STORED_PROCEDURES: ${SECURITY_CONFIG.ALLOW_STORED_PROCEDURES}

💡 ALTERNATIVA SEGURA:
Puedes usar 'mcp_sp_structure' para analizar el stored procedure sin ejecutarlo.`
    };
  }
  
  return { allowed: true };
}

/**
 * Validate if a SQL query is allowed to execute
 */
export function validateQueryPermission(query: string): { allowed: boolean; message?: string } {
  if (!query) {
    return { allowed: false, message: 'Query vacío o inválido' };
  }

  const hasModifications = containsModificationOperations(query);
  
  if (hasModifications) {
    return validateModificationPermission(`Consulta SQL: ${query.substring(0, 100)}...`);
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
  
  let securityLevel = 'MÁXIMA';
  let recommendations: string[] = [];
  
  if (modifications && storedProcs) {
    securityLevel = 'BAJA';
    recommendations.push('⚠️  Considera deshabilitar modificaciones en producción');
    recommendations.push('⚠️  Considera deshabilitar stored procedures en producción');
  } else if (modifications || storedProcs) {
    securityLevel = 'MEDIA';
    if (modifications) {
      recommendations.push('⚠️  Las modificaciones están habilitadas - usa con precaución');
    }
    if (storedProcs) {
      recommendations.push('⚠️  Los stored procedures están habilitados - usa con precaución');
    }
  } else {
    recommendations.push('✅ Configuración de seguridad óptima para producción');
  }
  
  return {
    modifications_enabled: modifications,
    stored_procedures_enabled: storedProcs,
    security_level: securityLevel,
    recommendations
  };
}