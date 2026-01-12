import { ToolResult } from './types.js';
import { getSecurityStatus, SECURITY_CONFIG } from '../security.js';

/**
 * Get current security configuration and status
 */
export const mcp_get_security_status = async (): Promise<ToolResult<any>> => {
  console.error('Executing mcp_get_security_status');

  try {
    const status = getSecurityStatus();
    
    const result = {
      security_configuration: {
        modifications_enabled: status.modifications_enabled,
        stored_procedures_enabled: status.stored_procedures_enabled,
        security_level: status.security_level
      },
      environment_variables: {
        DB_ALLOW_MODIFICATIONS: process.env.DB_ALLOW_MODIFICATIONS || 'not set (defaults to false)',
        DB_ALLOW_STORED_PROCEDURES: process.env.DB_ALLOW_STORED_PROCEDURES || 'not set (defaults to false)'
      },
      recommendations: status.recommendations,
      configuration_guide: {
        enable_modifications: 'Set DB_ALLOW_MODIFICATIONS=true in your environment',
        enable_stored_procedures: 'Set DB_ALLOW_STORED_PROCEDURES=true in your environment',
        security_best_practices: [
          'Keep modifications disabled in production environments',
          'Only enable stored procedures when necessary',
          'Review all queries before execution in production',
          'Use read-only database users when possible'
        ]
      }
    };

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error in mcp_get_security_status:', error.message);
    return { success: false, error: error.message };
  }
};