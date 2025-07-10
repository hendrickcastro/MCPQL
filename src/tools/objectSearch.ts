import { getPool } from '../db.js';
import { normalizeSqlObjectName } from '../utils.js';
import { ToolResult } from './types.js';

/**
 * Get dependencies for a database object (tables, views, stored procedures, etc.)
 */
export const mcp_get_dependencies = async (args: { object_name: string }): Promise<ToolResult<any[]>> => {
  const { object_name } = args;
  console.log('Executing mcp_get_dependencies with:', { object_name });

  try {
    const pool = getPool();
    const query = `
      SELECT 
          referenced_schema_name,
          referenced_entity_name,
          referenced_database_name,
          referenced_server_name
      FROM 
          sys.sql_expression_dependencies
      WHERE 
          referencing_id = OBJECT_ID(@object_name);
    `;
    const result = await pool.request()
      .input('object_name', object_name)
      .query(query);

    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error(`Error in mcp_get_dependencies for object ${object_name}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Search for database objects by name pattern
 */
export const mcp_search_objects_by_name = async (args: {
  pattern: string;
  object_types?: string[]
}): Promise<ToolResult<any[]>> => {
  const { pattern, object_types } = args;
  console.log('Executing mcp_search_objects_by_name with:', args);

  try {
    const pool = getPool();
    
    let typeFilter = '';
    if (object_types && object_types.length > 0) {
      const validTypes = object_types.map(type => {
        switch(type.toLowerCase()) {
          case 'table': return "'U'";
          case 'view': return "'V'";
          case 'procedure': return "'P'";
          case 'function': return "'FN', 'IF', 'TF'";
          case 'trigger': return "'TR'";
          default: return null;
        }
      }).filter(Boolean);
      
      if (validTypes.length > 0) {
        typeFilter = `AND o.type IN (${validTypes.join(', ')})`;
      }
    }
    
    const query = `
      SELECT 
          s.name AS schema_name,
          o.name AS object_name,
          o.type_desc AS object_type,
          SCHEMA_NAME(o.schema_id) + '.' + o.name AS full_name,
          o.create_date,
          o.modify_date
      FROM 
          sys.objects o
      JOIN 
          sys.schemas s ON o.schema_id = s.schema_id
      WHERE 
          o.name LIKE @pattern
          ${typeFilter}
      ORDER BY 
          s.name, o.name;
    `;
    
    const result = await pool.request()
      .input('pattern', `%${pattern}%`)
      .query(query);
    
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error(`Error in mcp_search_objects_by_name: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Search in object definitions
 */
export const mcp_search_in_definitions = async (args: {
  pattern: string;
  object_types?: string[]
}): Promise<ToolResult<any[]>> => {
  const { pattern, object_types } = args;
  console.log('Executing mcp_search_in_definitions with:', args);

  try {
    const pool = getPool();
    
    let typeFilter = '';
    if (object_types && object_types.length > 0) {
      const validTypes = object_types.map(type => {
        switch(type.toLowerCase()) {
          case 'procedure': return "'P'";
          case 'function': return "'FN', 'IF', 'TF'";
          case 'view': return "'V'";
          case 'trigger': return "'TR'";
          default: return null;
        }
      }).filter(Boolean);
      
      if (validTypes.length > 0) {
        typeFilter = `AND o.type IN (${validTypes.join(', ')})`;
      }
    }
    
    const query = `
      SELECT 
          SCHEMA_NAME(o.schema_id) AS schema_name,
          o.name AS object_name,
          o.type_desc AS object_type,
          SCHEMA_NAME(o.schema_id) + '.' + o.name AS full_name,
          o.create_date,
          o.modify_date
      FROM 
          sys.sql_modules m
      JOIN 
          sys.objects o ON m.object_id = o.object_id
      WHERE 
          m.definition LIKE @pattern
          ${typeFilter}
      ORDER BY 
          schema_name, object_name;
    `;
    
    const result = await pool.request()
      .input('pattern', `%${pattern}%`)
      .query(query);
    
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error(`Error in mcp_search_in_definitions: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Search for objects by their type
 */
export const mcp_search_objects_by_type = async (args: {
  object_type: string
}): Promise<ToolResult<any[]>> => {
  const { object_type } = args;
  console.log('Executing mcp_search_objects_by_type with:', args);

  try {
    const pool = getPool();
    
    let sqlType: string;
    switch(object_type.toLowerCase()) {
      case 'table': sqlType = "'U'"; break;
      case 'view': sqlType = "'V'"; break;
      case 'procedure': sqlType = "'P'"; break;
      case 'function': sqlType = "'FN', 'IF', 'TF'"; break;
      case 'trigger': sqlType = "'TR'"; break;
      default: sqlType = "'U'"; // Default to tables
    }
    
    const query = `
      SELECT 
          SCHEMA_NAME(o.schema_id) AS schema_name,
          o.name AS object_name,
          o.type_desc AS object_type,
          SCHEMA_NAME(o.schema_id) + '.' + o.name AS full_name,
          o.create_date,
          o.modify_date
      FROM 
          sys.objects o
      WHERE 
          o.type IN (${sqlType})
      ORDER BY 
          schema_name, object_name;
    `;
    
    const result = await pool.request().query(query);
    
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error(`Error in mcp_search_objects_by_type: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get detailed object dependencies
 */
export const mcp_get_object_dependencies = async (args: {
  object_name: string
}): Promise<ToolResult<any[]>> => {
  const { object_name } = args;
  console.log('Executing mcp_get_object_dependencies with:', args);

  const normalizedName = normalizeSqlObjectName(object_name);

  try {
    const pool = getPool();
    
    // Check if the object exists
    const objectCheckQuery = `
      SELECT object_id, type
      FROM sys.objects
      WHERE object_id = OBJECT_ID(@object_name);
    `;
    
    const objectCheck = await pool.request()
      .input('object_name', normalizedName)
      .query(objectCheckQuery);
    
    if (objectCheck.recordset.length === 0) {
      return { success: false, error: `Object ${object_name} not found` };
    }
    
    const objType = objectCheck.recordset[0].type;
    
    // Get objects that this object depends on
    const dependsOnQuery = `
      SELECT DISTINCT
          ISNULL(dep.referenced_schema_name, 'dbo') AS schema_name,
          dep.referenced_entity_name AS object_name,
          o.type_desc AS object_type,
          'depends_on' AS relationship_type
      FROM sys.dm_sql_referenced_entities(@object_name, 'OBJECT') dep
      LEFT JOIN sys.objects o ON OBJECT_ID(ISNULL(dep.referenced_schema_name + '.', '') + 
                                        dep.referenced_entity_name) = o.object_id
      WHERE dep.referenced_id IS NOT NULL
      
      UNION ALL
      
      SELECT DISTINCT
          SCHEMA_NAME(o.schema_id) AS schema_name,
          o.name AS object_name,
          o.type_desc AS object_type,
          'referenced_by' AS relationship_type
      FROM sys.dm_sql_referencing_entities(@object_name, 'OBJECT') ref
      JOIN sys.objects o ON ref.referencing_id = o.object_id
    `;
    
    const result = await pool.request()
      .input('object_name', normalizedName)
      .query(dependsOnQuery);
    
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error(`Error in mcp_get_object_dependencies: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Comprehensive search for database objects
 */
export const mcp_search_comprehensive = async (args: {
  pattern: string;
  search_in_names?: boolean;
  search_in_definitions?: boolean;
  object_types?: string[]
}): Promise<ToolResult<{
  name_matches: any[];
  definition_matches: any[];
  total_matches: number;
}>> => {
  const { 
    pattern, 
    search_in_names = true, 
    search_in_definitions = true, 
    object_types 
  } = args;
  console.log('Executing mcp_search_comprehensive with:', args);

  try {
    const promises = [];
    
    // Search in object names
    if (search_in_names) {
      promises.push(mcp_search_objects_by_name({ pattern, object_types }));
    } else {
      // Return empty result with the expected structure
      promises.push(Promise.resolve({ success: true as const, data: [] }));
    }
    
    // Search in object definitions 
    if (search_in_definitions) {
      promises.push(mcp_search_in_definitions({ pattern, object_types }));
    } else {
      // Return empty result with the expected structure
      promises.push(Promise.resolve({ success: true as const, data: [] }));
    }
    
    const [nameResults, definitionResults] = await Promise.all(promises);
    
    if (!nameResults.success) return nameResults;
    if (!definitionResults.success) return definitionResults;
    
    const nameMatches = nameResults.data;
    const definitionMatches = definitionResults.data;
    
    return {
      success: true,
      data: {
        name_matches: nameMatches,
        definition_matches: definitionMatches,
        total_matches: nameMatches.length + definitionMatches.length
      }
    };
  } catch (error: any) {
    console.error(`Error in mcp_search_comprehensive: ${error.message}`);
    return { success: false, error: error.message };
  }
};
