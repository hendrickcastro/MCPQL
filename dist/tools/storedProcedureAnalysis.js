import { getPool } from '../db.js';
import { normalizeSqlObjectName } from '../utils.js';
/**
 * Analyze SQL Server stored procedure structure including parameters, dependencies, and source code
 */
export const mcp_sp_structure = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_sp_structure with:', { sp_name });
    const qualified_name = normalizeSqlObjectName(sp_name);
    try {
        const pool = getPool();
        // Enhanced query for basic information - matching Python implementation
        const infoQuery = `
      SELECT 
          OBJECT_SCHEMA_NAME(o.object_id) as schema_name,
          o.name as procedure_name,
          o.create_date,
          o.modify_date,
          m.definition as source_code,
          o.type_desc,
          CAST(ep.value AS NVARCHAR(MAX)) AS description
      FROM sys.objects o
      INNER JOIN sys.sql_modules m ON o.object_id = m.object_id
      LEFT JOIN sys.extended_properties ep ON o.object_id = ep.major_id AND ep.minor_id = 0 AND ep.name = 'MS_Description'
      WHERE o.type = 'P'
      AND o.object_id = OBJECT_ID(@qualified_name);
    `;
        // Enhanced query for parameters - matching Python implementation
        const paramsQuery = `
      SELECT 
          p.name as parameter_name,
          t.name as data_type,
          p.max_length,
          p.precision,
          p.scale,
          p.is_output,
          p.has_default_value,
          p.default_value,
          p.parameter_id
      FROM sys.parameters p
      INNER JOIN sys.types t ON p.system_type_id = t.system_type_id AND t.user_type_id = t.system_type_id
      WHERE p.object_id = OBJECT_ID(@qualified_name)
      ORDER BY p.parameter_id;
    `;
        // Enhanced query for dependencies - matching Python implementation
        const dependenciesQuery = `
      SELECT DISTINCT
          dep.referenced_schema_name,
          dep.referenced_entity_name,
          o.type_desc as referenced_type,
          dep.referenced_database_name,
          dep.referenced_server_name
      FROM sys.dm_sql_referenced_entities(@qualified_name, 'OBJECT') dep
      LEFT JOIN sys.objects o ON OBJECT_ID(ISNULL(dep.referenced_database_name + '.', '') + 
                                          ISNULL(dep.referenced_schema_name + '.', '') + 
                                          dep.referenced_entity_name) = o.object_id
      WHERE dep.referenced_id IS NOT NULL
      ORDER BY dep.referenced_schema_name, dep.referenced_entity_name;
    `;
        // Execute all queries in parallel
        const [infoResult, paramsResult, dependenciesResult] = await Promise.all([
            pool.request().input('qualified_name', qualified_name).query(infoQuery),
            pool.request().input('qualified_name', qualified_name).query(paramsQuery),
            pool.request().input('qualified_name', qualified_name).query(dependenciesQuery)
        ]);
        return {
            success: true,
            data: {
                info: infoResult.recordset[0] || null,
                parameters: paramsResult.recordset,
                dependencies: dependenciesResult.recordset,
                definition: infoResult.recordset[0]?.source_code || null
            }
        };
    }
    catch (error) {
        console.error(`Error in mcp_sp_structure for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get stored procedure basic information
 */
export const mcp_get_sp_info = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_info with:', { sp_name });
    const qualified_name = normalizeSqlObjectName(sp_name);
    try {
        const pool = getPool();
        const query = `
      SELECT 
          OBJECT_SCHEMA_NAME(o.object_id) as schema_name,
          o.name as procedure_name,
          o.create_date,
          o.modify_date,
          o.type_desc,
          CAST(ep.value AS NVARCHAR(MAX)) AS description
      FROM sys.objects o
      LEFT JOIN sys.extended_properties ep ON o.object_id = ep.major_id AND ep.minor_id = 0 AND ep.name = 'MS_Description'
      WHERE o.type = 'P'
      AND o.object_id = OBJECT_ID(@qualified_name);
    `;
        const result = await pool.request()
            .input('qualified_name', qualified_name)
            .query(query);
        return {
            success: true,
            data: result.recordset[0] || null
        };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_info for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get stored procedure parameters
 */
export const mcp_get_sp_parameters = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_parameters with:', { sp_name });
    const qualified_name = normalizeSqlObjectName(sp_name);
    try {
        const pool = getPool();
        const query = `
      SELECT 
          p.name as parameter_name,
          t.name as data_type,
          p.max_length,
          p.precision,
          p.scale,
          p.is_output,
          p.has_default_value,
          p.default_value,
          p.parameter_id
      FROM sys.parameters p
      INNER JOIN sys.types t ON p.system_type_id = t.system_type_id AND t.user_type_id = t.system_type_id
      WHERE p.object_id = OBJECT_ID(@qualified_name)
      ORDER BY p.parameter_id;
    `;
        const result = await pool.request()
            .input('qualified_name', qualified_name)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_parameters for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get stored procedure dependencies
 */
export const mcp_get_sp_dependencies = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_dependencies with:', { sp_name });
    const qualified_name = normalizeSqlObjectName(sp_name);
    try {
        const pool = getPool();
        const query = `
      SELECT DISTINCT
          dep.referenced_schema_name,
          dep.referenced_entity_name,
          o.type_desc as referenced_type,
          dep.referenced_database_name,
          dep.referenced_server_name
      FROM sys.dm_sql_referenced_entities(@qualified_name, 'OBJECT') dep
      LEFT JOIN sys.objects o ON OBJECT_ID(ISNULL(dep.referenced_database_name + '.', '') + 
                                          ISNULL(dep.referenced_schema_name + '.', '') + 
                                          dep.referenced_entity_name) = o.object_id
      WHERE dep.referenced_id IS NOT NULL
      ORDER BY dep.referenced_schema_name, dep.referenced_entity_name;
    `;
        const result = await pool.request()
            .input('qualified_name', qualified_name)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_dependencies for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get stored procedure definition
 */
export const mcp_get_sp_definition = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_definition with:', { sp_name });
    const qualified_name = normalizeSqlObjectName(sp_name);
    try {
        const pool = getPool();
        const query = `
      SELECT m.definition as source_code
      FROM sys.objects o
      INNER JOIN sys.sql_modules m ON o.object_id = m.object_id
      WHERE o.type = 'P'
      AND o.object_id = OBJECT_ID(@qualified_name);
    `;
        const result = await pool.request()
            .input('qualified_name', qualified_name)
            .query(query);
        return {
            success: true,
            data: result.recordset[0]?.source_code || null
        };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_definition for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get complete structure of a stored procedure
 */
export const mcp_get_sp_complete_structure = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_complete_structure with:', { sp_name });
    try {
        // Call individual functions in parallel for performance
        const [infoResult, parametersResult, dependenciesResult, definitionResult] = await Promise.all([
            mcp_get_sp_info({ sp_name }),
            mcp_get_sp_parameters({ sp_name }),
            mcp_get_sp_dependencies({ sp_name }),
            mcp_get_sp_definition({ sp_name })
        ]);
        // Check if any of the calls failed
        if (!infoResult.success)
            return infoResult;
        if (!parametersResult.success)
            return parametersResult;
        if (!dependenciesResult.success)
            return dependenciesResult;
        if (!definitionResult.success)
            return definitionResult;
        return {
            success: true,
            data: {
                info: infoResult.data,
                parameters: parametersResult.data,
                dependencies: dependenciesResult.data,
                definition: definitionResult.data
            }
        };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_complete_structure for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get stored procedure definition (simpler version)
 */
export const mcp_get_sp_definition_simple = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_definition_simple with:', { sp_name });
    const qualified_name = normalizeSqlObjectName(sp_name);
    try {
        const pool = getPool();
        const query = `
      SELECT m.definition
      FROM sys.sql_modules m
      JOIN sys.objects o ON m.object_id = o.object_id
      WHERE o.object_id = OBJECT_ID(@qualified_name);
    `;
        const result = await pool.request()
            .input('qualified_name', qualified_name)
            .query(query);
        return {
            success: true,
            data: result.recordset[0]?.definition || null
        };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_definition_simple for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get stored procedure parameters (simpler version)
 */
export const mcp_get_sp_parameters_simple = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_parameters_simple with:', { sp_name });
    const qualified_name = normalizeSqlObjectName(sp_name);
    try {
        const pool = getPool();
        const query = `
      SELECT 
          p.name as parameter_name,
          t.name as data_type,
          p.is_output,
          p.has_default_value
      FROM sys.parameters p
      INNER JOIN sys.types t ON p.system_type_id = t.system_type_id AND t.user_type_id = t.system_type_id
      WHERE p.object_id = OBJECT_ID(@qualified_name)
      ORDER BY p.parameter_id;
    `;
        const result = await pool.request()
            .input('qualified_name', qualified_name)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_parameters_simple for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get stored procedure dependencies (simpler version)
 */
export const mcp_get_sp_dependencies_simple = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_dependencies_simple with:', { sp_name });
    const qualified_name = normalizeSqlObjectName(sp_name);
    try {
        const pool = getPool();
        const query = `
      SELECT DISTINCT
          ISNULL(dep.referenced_schema_name, 'dbo') as schema_name,
          dep.referenced_entity_name as object_name,
          o.type_desc as object_type
      FROM sys.dm_sql_referenced_entities(@qualified_name, 'OBJECT') dep
      LEFT JOIN sys.objects o ON OBJECT_ID(ISNULL(dep.referenced_schema_name + '.', '') + 
                                          dep.referenced_entity_name) = o.object_id
      WHERE dep.referenced_id IS NOT NULL
      ORDER BY schema_name, object_name;
    `;
        const result = await pool.request()
            .input('qualified_name', qualified_name)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_dependencies_simple for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get all stored procedure info in a single call (simpler version)
 */
export const mcp_get_sp_all_info_simple = async (args) => {
    const { sp_name } = args;
    console.error('Executing mcp_get_sp_all_info_simple with:', { sp_name });
    try {
        // Call individual functions in parallel for performance
        const [definitionResult, parametersResult, dependenciesResult] = await Promise.all([
            mcp_get_sp_definition_simple({ sp_name }),
            mcp_get_sp_parameters_simple({ sp_name }),
            mcp_get_sp_dependencies_simple({ sp_name })
        ]);
        // Check if any of the calls failed
        if (!definitionResult.success)
            return definitionResult;
        if (!parametersResult.success)
            return parametersResult;
        if (!dependenciesResult.success)
            return dependenciesResult;
        return {
            success: true,
            data: {
                definition: definitionResult.data,
                parameters: parametersResult.data,
                dependencies: dependenciesResult.data
            }
        };
    }
    catch (error) {
        console.error(`Error in mcp_get_sp_all_info_simple for SP ${sp_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
