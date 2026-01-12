import { getPool } from '../db.js';
import { normalizeSqlObjectName } from '../utils.js';
/**
 * Analyze SQL Server table structure including columns, primary keys, foreign keys, and constraints
 */
export const mcp_table_analysis = async (args) => {
    const { table_name } = args;
    console.error('Executing mcp_table_analysis with:', { table_name });
    const normalizedTableName = normalizeSqlObjectName(table_name);
    try {
        const pool = getPool();
        // Enhanced query for columns - matching Python implementation
        const columnsQuery = `
      SELECT 
          c.name AS column_name,
          t.name AS data_type,
          c.max_length,
          c.precision,
          c.scale,
          c.is_nullable,
          c.is_identity,
          c.is_computed,
          cc.definition AS computed_definition,
          CAST(ep.value AS NVARCHAR(MAX)) AS description,
          c.column_id,
          ISNULL(dc.definition, '') AS default_value
      FROM 
          sys.columns c
      INNER JOIN 
          sys.types t ON c.user_type_id = t.user_type_id
      LEFT JOIN 
          sys.computed_columns cc ON c.object_id = cc.object_id AND c.column_id = cc.column_id
      LEFT JOIN 
          sys.extended_properties ep ON c.object_id = ep.major_id AND c.column_id = ep.minor_id
      LEFT JOIN
          sys.default_constraints dc ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
      WHERE 
          c.object_id = OBJECT_ID(@table_name)
      ORDER BY 
          c.column_id;
    `;
        // Enhanced query for primary keys - matching Python implementation
        const primaryKeysQuery = `
      SELECT 
          i.name AS index_name,
          c.name AS column_name,
          ic.key_ordinal
      FROM 
          sys.indexes i
      INNER JOIN 
          sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN 
          sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE 
          i.object_id = OBJECT_ID(@table_name)
          AND i.is_primary_key = 1
      ORDER BY 
          ic.key_ordinal;
    `;
        // Enhanced query for foreign keys - matching Python implementation
        const foreignKeysQuery = `
      SELECT 
          fk.name AS constraint_name,
          pc.name AS parent_column,
          rc.name AS referenced_column,
          ro.name AS referenced_table,
          rs.name AS referenced_schema,
          fk.delete_referential_action_desc,
          fk.update_referential_action_desc
      FROM 
          sys.foreign_keys fk
      INNER JOIN 
          sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN 
          sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
      INNER JOIN 
          sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
      INNER JOIN 
          sys.objects ro ON fkc.referenced_object_id = ro.object_id
      INNER JOIN 
          sys.schemas rs ON ro.schema_id = rs.schema_id
      WHERE 
          fk.parent_object_id = OBJECT_ID(@table_name)
      ORDER BY 
          fk.name, fkc.constraint_column_id;
    `;
        // Enhanced query for indexes - matching Python implementation
        const indexesQuery = `
      SELECT 
          i.name AS index_name,
          i.type_desc AS index_type,
          i.is_unique,
          i.is_primary_key,
          STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns,
          STRING_AGG(
            CASE WHEN ic.is_included_column = 1 THEN c.name END, 
            ', '
          ) WITHIN GROUP (ORDER BY ic.key_ordinal) AS included_columns
      FROM 
          sys.indexes i
      INNER JOIN 
          sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN 
          sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE 
          i.object_id = OBJECT_ID(@table_name)
          AND i.type > 0  -- Exclude heaps
      GROUP BY 
          i.name, i.type_desc, i.is_unique, i.is_primary_key
      ORDER BY 
          i.name;
    `;
        // Enhanced query for constraints - matching Python implementation
        const constraintsQuery = `
      SELECT 
          cc.name AS constraint_name,
          cc.type_desc AS constraint_type,
          cc.definition AS constraint_definition,
          c.name AS column_name
      FROM 
          sys.check_constraints cc
      LEFT JOIN 
          sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
      WHERE 
          cc.parent_object_id = OBJECT_ID(@table_name)
      UNION ALL
      SELECT 
          dc.name AS constraint_name,
          'DEFAULT_CONSTRAINT' AS constraint_type,
          dc.definition AS constraint_definition,
          c.name AS column_name
      FROM 
          sys.default_constraints dc
      INNER JOIN 
          sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
      WHERE 
          dc.parent_object_id = OBJECT_ID(@table_name)
      ORDER BY 
          constraint_name;
    `;
        // Enhanced query for table information
        const tableInfoQuery = `
      SELECT 
          t.name AS table_name,
          s.name AS schema_name,
          t.create_date,
          t.modify_date,
          ISNULL(p.row_count, 0) AS row_count,
          CAST(ep.value AS NVARCHAR(MAX)) AS table_description
      FROM 
          sys.tables t
      INNER JOIN 
          sys.schemas s ON t.schema_id = s.schema_id
      LEFT JOIN 
          sys.dm_db_partition_stats p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
      LEFT JOIN 
          sys.extended_properties ep ON t.object_id = ep.major_id AND ep.minor_id = 0 AND ep.name = 'MS_Description'
      WHERE 
          t.object_id = OBJECT_ID(@table_name);
    `;
        // Execute all queries in parallel
        const [columnsResult, primaryKeysResult, foreignKeysResult, indexesResult, constraintsResult, tableInfoResult] = await Promise.all([
            pool.request().input('table_name', normalizedTableName).query(columnsQuery),
            pool.request().input('table_name', normalizedTableName).query(primaryKeysQuery),
            pool.request().input('table_name', normalizedTableName).query(foreignKeysQuery),
            pool.request().input('table_name', normalizedTableName).query(indexesQuery),
            pool.request().input('table_name', normalizedTableName).query(constraintsQuery),
            pool.request().input('table_name', normalizedTableName).query(tableInfoQuery)
        ]);
        return {
            success: true,
            data: {
                columns: columnsResult.recordset,
                primary_keys: primaryKeysResult.recordset,
                foreign_keys: foreignKeysResult.recordset,
                indexes: indexesResult.recordset,
                constraints: constraintsResult.recordset,
                table_info: tableInfoResult.recordset[0] || null
            }
        };
    }
    catch (error) {
        console.error(`Error in mcp_table_analysis for table ${table_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get columns for a specific table
 */
export const mcp_get_columns = async (args) => {
    const { table_name } = args;
    console.error('Executing mcp_get_columns with:', { table_name });
    const normalizedTableName = normalizeSqlObjectName(table_name);
    try {
        const pool = getPool();
        const query = `
      SELECT 
          c.name AS column_name,
          t.name AS data_type,
          c.max_length,
          c.precision,
          c.scale,
          c.is_nullable,
          c.is_identity,
          c.is_computed,
          cc.definition AS computed_definition,
          CAST(ep.value AS NVARCHAR(MAX)) AS description,
          c.column_id,
          ISNULL(dc.definition, '') AS default_value
      FROM 
          sys.columns c
      INNER JOIN 
          sys.types t ON c.user_type_id = t.user_type_id
      LEFT JOIN 
          sys.computed_columns cc ON c.object_id = cc.object_id AND c.column_id = cc.column_id
      LEFT JOIN 
          sys.extended_properties ep ON c.object_id = ep.major_id AND c.column_id = ep.minor_id
      LEFT JOIN
          sys.default_constraints dc ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
      WHERE 
          c.object_id = OBJECT_ID(@table_name)
      ORDER BY 
          c.column_id;
    `;
        const result = await pool.request()
            .input('table_name', normalizedTableName)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_columns for table ${table_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get primary keys for a specific table
 */
export const mcp_get_primary_keys = async (args) => {
    const { table_name } = args;
    console.error('Executing mcp_get_primary_keys with:', { table_name });
    const normalizedTableName = normalizeSqlObjectName(table_name);
    try {
        const pool = getPool();
        const query = `
      SELECT 
          i.name AS index_name,
          c.name AS column_name,
          ic.key_ordinal
      FROM 
          sys.indexes i
      INNER JOIN 
          sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN 
          sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE 
          i.object_id = OBJECT_ID(@table_name)
          AND i.is_primary_key = 1
      ORDER BY 
          ic.key_ordinal;
    `;
        const result = await pool.request()
            .input('table_name', normalizedTableName)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_primary_keys for table ${table_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get foreign keys for a specific table
 */
export const mcp_get_foreign_keys = async (args) => {
    const { table_name } = args;
    console.error('Executing mcp_get_foreign_keys with:', { table_name });
    const normalizedTableName = normalizeSqlObjectName(table_name);
    try {
        const pool = getPool();
        const query = `
      SELECT 
          fk.name AS constraint_name,
          pc.name AS parent_column,
          rc.name AS referenced_column,
          ro.name AS referenced_table,
          rs.name AS referenced_schema,
          fk.delete_referential_action_desc,
          fk.update_referential_action_desc
      FROM 
          sys.foreign_keys fk
      INNER JOIN 
          sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN 
          sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
      INNER JOIN 
          sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
      INNER JOIN 
          sys.objects ro ON fkc.referenced_object_id = ro.object_id
      INNER JOIN 
          sys.schemas rs ON ro.schema_id = rs.schema_id
      WHERE 
          fk.parent_object_id = OBJECT_ID(@table_name)
      ORDER BY 
          fk.name, fkc.constraint_column_id;
    `;
        const result = await pool.request()
            .input('table_name', normalizedTableName)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_foreign_keys for table ${table_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get indexes for a specific table
 */
export const mcp_get_indexes = async (args) => {
    const { table_name } = args;
    console.error('Executing mcp_get_indexes with:', { table_name });
    const normalizedTableName = normalizeSqlObjectName(table_name);
    try {
        const pool = getPool();
        const query = `
      SELECT 
          i.name AS index_name,
          i.type_desc AS index_type,
          i.is_unique,
          i.is_primary_key,
          STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns,
          STRING_AGG(
            CASE WHEN ic.is_included_column = 1 THEN c.name END, 
            ', '
          ) WITHIN GROUP (ORDER BY ic.key_ordinal) AS included_columns
      FROM 
          sys.indexes i
      INNER JOIN 
          sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN 
          sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE 
          i.object_id = OBJECT_ID(@table_name)
          AND i.type > 0  -- Exclude heaps
      GROUP BY 
          i.name, i.type_desc, i.is_unique, i.is_primary_key
      ORDER BY 
          i.name;
    `;
        const result = await pool.request()
            .input('table_name', normalizedTableName)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_indexes for table ${table_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get constraints for a specific table
 */
export const mcp_get_constraints = async (args) => {
    const { table_name } = args;
    console.error('Executing mcp_get_constraints with:', { table_name });
    const normalizedTableName = normalizeSqlObjectName(table_name);
    try {
        const pool = getPool();
        const query = `
      SELECT 
          cc.name AS constraint_name,
          cc.type_desc AS constraint_type,
          cc.definition AS constraint_definition,
          c.name AS column_name
      FROM 
          sys.check_constraints cc
      LEFT JOIN 
          sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
      WHERE 
          cc.parent_object_id = OBJECT_ID(@table_name)
      UNION ALL
      SELECT 
          dc.name AS constraint_name,
          'DEFAULT_CONSTRAINT' AS constraint_type,
          dc.definition AS constraint_definition,
          c.name AS column_name
      FROM 
          sys.default_constraints dc
      INNER JOIN 
          sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
      WHERE 
          dc.parent_object_id = OBJECT_ID(@table_name)
      ORDER BY 
          constraint_name;
    `;
        const result = await pool.request()
            .input('table_name', normalizedTableName)
            .query(query);
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.error(`Error in mcp_get_constraints for table ${table_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
/**
 * Get all table information in a single call
 */
export const mcp_get_all_table_info = async (args) => {
    const { table_name } = args;
    console.error('Executing mcp_get_all_table_info with:', { table_name });
    try {
        // Call individual functions in parallel for performance
        const [columnsResult, primaryKeysResult, foreignKeysResult, indexesResult, constraintsResult] = await Promise.all([
            mcp_get_columns({ table_name }),
            mcp_get_primary_keys({ table_name }),
            mcp_get_foreign_keys({ table_name }),
            mcp_get_indexes({ table_name }),
            mcp_get_constraints({ table_name })
        ]);
        // Check if any of the calls failed
        if (!columnsResult.success)
            return columnsResult;
        if (!primaryKeysResult.success)
            return primaryKeysResult;
        if (!foreignKeysResult.success)
            return foreignKeysResult;
        if (!indexesResult.success)
            return indexesResult;
        if (!constraintsResult.success)
            return constraintsResult;
        return {
            success: true,
            data: {
                columns: columnsResult.data,
                primary_keys: primaryKeysResult.data,
                foreign_keys: foreignKeysResult.data,
                indexes: indexesResult.data,
                constraints: constraintsResult.data
            }
        };
    }
    catch (error) {
        console.error(`Error in mcp_get_all_table_info for table ${table_name}: ${error.message}`);
        return { success: false, error: error.message };
    }
};
