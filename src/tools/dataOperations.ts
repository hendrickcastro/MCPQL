import { getPool } from '../db.js';
import { normalizeSqlObjectName } from '../utils.js';
import { ToolResult } from './types.js';
import { validateStoredProcedurePermission, validateQueryPermission } from '../security.js';

/**
 * Execute a SQL Server stored procedure with parameters and return results
 */
export const mcp_execute_procedure = async (args: { sp_name: string; params?: object }): Promise<ToolResult<any[]>> => {
  const { sp_name, params } = args;
  console.log('Executing mcp_execute_procedure with:', args);

  // Security validation for stored procedure execution
  const permission = validateStoredProcedurePermission(sp_name);
  if (!permission.allowed) {
    return { success: false, error: permission.message || 'Stored procedure execution not allowed' };
  }

  try {
    const pool = getPool();
    const request = pool.request();

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
    }

    const result = await request.execute(sp_name);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error(`Error in mcp_execute_procedure for SP ${sp_name}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get a preview of data from a SQL Server table with optional filters
 */
export const mcp_preview_data = async (args: { table_name: string; filters?: object; limit?: number }): Promise<ToolResult<any[]>> => {
  const { table_name, filters, limit = 100 } = args;
  console.log('Executing mcp_preview_data with:', args);

  try {
    const pool = getPool();
    const request = pool.request();

    const normalizedTableName = normalizeSqlObjectName(table_name);
    let query = `SELECT TOP ${limit} * FROM ${normalizedTableName}`;

    if (filters && Object.keys(filters).length > 0) {
      const whereClauses = Object.entries(filters).map(([key, value], index) => {
        const paramName = `param${index}`;
        request.input(paramName, value);
        return `${key} = @${paramName}`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const result = await request.query(query);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error('Error in mcp_preview_data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Execute a raw SQL query
 */
export const mcp_execute_query = async (args: { query: string }): Promise<ToolResult<any[]>> => {
  const { query } = args;
  console.log('Executing mcp_execute_query with query:', query);

  // Security validation for SQL query execution
  const permission = validateQueryPermission(query);
  if (!permission.allowed) {
    return { success: false, error: permission.message || 'Query execution not allowed' };
  }

  try {
    const pool = getPool();
    const result = await pool.request().query(query);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    // Only log the error message, not the full stack trace for cleaner output
    console.error(`Error in mcp_execute_query: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get statistics for a specific column in a table
 */
export const mcp_get_column_stats = async (args: { table_name: string, column_name: string }): Promise<ToolResult<any>> => {
  const { table_name, column_name } = args;
  console.log('Executing mcp_get_column_stats with:', args);

  try {
    const pool = getPool();
    const normalizedTableName = normalizeSqlObjectName(table_name);
    
    // Note: We're using double quotes for identifiers and params for values to prevent SQL injection
    const query = `
      SELECT
        '${column_name}' as column_name,
        COUNT(*) AS total_rows,
        SUM(CASE WHEN [${column_name}] IS NULL THEN 1 ELSE 0 END) AS null_count,
        COUNT(DISTINCT [${column_name}]) AS distinct_count,
        MIN([${column_name}]) AS min_value,
        MAX([${column_name}]) AS max_value
      FROM ${normalizedTableName}
    `;
    
    const result = await pool.request().query(query);
    
    // Get sample values
    const sampleQuery = `
      SELECT TOP 10 [${column_name}] AS value
      FROM ${normalizedTableName}
      WHERE [${column_name}] IS NOT NULL
      GROUP BY [${column_name}]
      ORDER BY COUNT(*) DESC
    `;
    
    const sampleResult = await pool.request().query(sampleQuery);
    
    const stats = result.recordset[0] || {};
    
    return { 
      success: true, 
      data: {
        ...stats,
        sample_values: sampleResult.recordset.map(row => row.value)
      }
    };
  } catch (error: any) {
    console.error(`Error in mcp_get_column_stats for table ${table_name}, column ${column_name}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced version of preview data
 */
export const mcp_preview_data_enhanced = async (args: {
  table_name: string;
  filters?: Record<string, any>;
  limit?: number
}): Promise<ToolResult<any[]>> => {
  const { table_name, filters, limit = 100 } = args;
  console.log('Executing mcp_preview_data_enhanced with:', args);

  try {
    const pool = getPool();
    const request = pool.request();

    const normalizedTableName = normalizeSqlObjectName(table_name);
    
    // Get column names first to handle them properly
    const columnsQuery = `
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${normalizedTableName.split('.').pop()}' 
      AND TABLE_SCHEMA = '${normalizedTableName.split('.')[0]}'
    `;
    
    const columnsResult = await pool.request().query(columnsQuery);
    
    // Build the query with proper handling of column names
    let query = `SELECT TOP ${limit} * FROM ${normalizedTableName}`;

    if (filters && Object.keys(filters).length > 0) {
      const whereClauses = Object.entries(filters).map(([key, value], index) => {
        const paramName = `param${index}`;
        request.input(paramName, value);
        
        // Handle NULL values specially
        if (value === null) {
          return `[${key}] IS NULL`;
        }
        return `[${key}] = @${paramName}`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Add ORDER BY for consistent results
    query += ` ORDER BY (SELECT NULL)`;
    
    const result = await request.query(query);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error(`Error in mcp_preview_data_enhanced: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get sample values for a column
 */
export const mcp_get_sample_values = async (args: {
  table_name: string;
  column_name: string;
  limit?: number
}): Promise<ToolResult<any[]>> => {
  const { table_name, column_name, limit = 10 } = args;
  console.log('Executing mcp_get_sample_values with:', args);

  try {
    const pool = getPool();
    const normalizedTableName = normalizeSqlObjectName(table_name);
    
    const query = `
      SELECT TOP ${limit} [${column_name}] AS value, COUNT(*) AS frequency
      FROM ${normalizedTableName}
      WHERE [${column_name}] IS NOT NULL
      GROUP BY [${column_name}]
      ORDER BY COUNT(*) DESC, [${column_name}]
    `;
    
    const result = await pool.request().query(query);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error(`Error in mcp_get_sample_values: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get enhanced statistics for a column
 */
export const mcp_get_column_stats_enhanced = async (args: {
  table_name: string;
  column_name: string
}): Promise<ToolResult<{
  total_rows: number;
  distinct_values: number;
  null_count: number;
  min_value: any;
  max_value: any;
  sample_values: any[];
}>> => {
  const { table_name, column_name } = args;
  console.log('Executing mcp_get_column_stats_enhanced with:', args);

  try {
    const pool = getPool();
    const normalizedTableName = normalizeSqlObjectName(table_name);
    
    // Get basic stats
    const statsQuery = `
      SELECT
        COUNT(*) AS total_rows,
        COUNT(DISTINCT [${column_name}]) AS distinct_values,
        SUM(CASE WHEN [${column_name}] IS NULL THEN 1 ELSE 0 END) AS null_count,
        MIN([${column_name}]) AS min_value,
        MAX([${column_name}]) AS max_value
      FROM ${normalizedTableName}
    `;
    
    // Get sample values with frequencies
    const sampleQuery = `
      SELECT TOP 10 [${column_name}] AS value, COUNT(*) AS frequency
      FROM ${normalizedTableName}
      WHERE [${column_name}] IS NOT NULL
      GROUP BY [${column_name}]
      ORDER BY COUNT(*) DESC, [${column_name}]
    `;
    
    const [statsResult, sampleResult] = await Promise.all([
      pool.request().query(statsQuery),
      pool.request().query(sampleQuery)
    ]);
    
    const stats = statsResult.recordset[0] || {};
    
    return {
      success: true,
      data: {
        total_rows: stats.total_rows || 0,
        distinct_values: stats.distinct_values || 0,
        null_count: stats.null_count || 0,
        min_value: stats.min_value,
        max_value: stats.max_value,
        sample_values: sampleResult.recordset
      }
    };
  } catch (error: any) {
    console.error(`Error in mcp_get_column_stats_enhanced: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Perform quick data analysis on a table
 */
export const mcp_quick_data_analysis = async (args: {
  table_name: string;
  limit?: number
}): Promise<ToolResult<{
  preview_data: any[];
  column_count: number;
  row_count: number;
  columns_info: any[];
}>> => {
  const { table_name, limit = 100 } = args;
  console.log('Executing mcp_quick_data_analysis with:', args);

  try {
    const pool = getPool();
    const normalizedTableName = normalizeSqlObjectName(table_name);
    
    // Get table column information
    const columnsQuery = `
      SELECT 
        c.name AS column_name,
        t.name AS data_type,
        c.max_length,
        c.precision,
        c.scale,
        c.is_nullable,
        c.is_identity
      FROM 
          sys.columns c
      INNER JOIN 
          sys.types t ON c.user_type_id = t.user_type_id
      WHERE 
          c.object_id = OBJECT_ID(@table_name)
      ORDER BY 
          c.column_id;
    `;
    
    // Get row count
    const countQuery = `
      SELECT COUNT(*) AS row_count FROM ${normalizedTableName}
    `;
    
    // Get preview data
    const previewQuery = `
      SELECT TOP ${limit} * FROM ${normalizedTableName} ORDER BY (SELECT NULL)
    `;
    
    // Execute all queries in parallel
    const [columnsResult, countResult, previewResult] = await Promise.all([
      pool.request().input('table_name', normalizedTableName).query(columnsQuery),
      pool.request().query(countQuery),
      pool.request().query(previewQuery)
    ]);
    
    return {
      success: true,
      data: {
        preview_data: previewResult.recordset,
        column_count: columnsResult.recordset.length,
        row_count: countResult.recordset[0]?.row_count || 0,
        columns_info: columnsResult.recordset
      }
    };
  } catch (error: any) {
    console.error(`Error in mcp_quick_data_analysis: ${error.message}`);
    return { success: false, error: error.message };
  }
};
