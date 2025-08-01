// Export all tools from their respective modules

// Export type definitions
export * from './types.js';

// Export the 10 consolidated tools defined in tools.ts

// 1. Table Analysis tools
export {
  mcp_table_analysis     // Complete table analysis
} from './tableAnalysis.js';

// 2. Stored Procedure Analysis tools
export {
  mcp_sp_structure,       // Complete stored procedure analysis
  mcp_get_sp_all_info_simple // Para compatibilidad con server.ts
} from './storedProcedureAnalysis.js';

// 3-4, 7, 10. Data operation tools
export {
  mcp_preview_data,      // Data preview with filters
  mcp_preview_data_enhanced, // Para compatibilidad con server.ts
  mcp_get_column_stats,   // Column statistics
  mcp_get_column_stats_enhanced, // Para compatibilidad con server.ts
  mcp_quick_data_analysis, // Quick table analysis
  mcp_get_sample_values   // Sample values from column
} from './dataOperations.js';

// 5-6. SQL execution tools
export {
  mcp_execute_procedure, // Execute stored procedure
  mcp_execute_query       // Execute SQL query
} from './dataOperations.js';

// 8-9. Search tools
export {
  mcp_search_comprehensive, // Comprehensive search
  mcp_get_dependencies,      // Object dependencies
  // Funciones adicionales para compatibilidad con server.ts
  mcp_search_objects_by_name,
  mcp_search_in_definitions,
  mcp_search_objects_by_type,
  mcp_get_object_dependencies
} from './objectSearch.js';

// Security tools
export {
  mcp_get_security_status   // Get current security configuration
} from './securityOperations.js';
