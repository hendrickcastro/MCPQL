export const MCP_MSQL_TOOLS = [
  // 1. TABLA - ANLISIS COMPLETO (consolidado)
  {
    name: "mcp_table_analysis",
    description: "Comprehensive SQL Server table analysis including structure, columns, keys, indexes, and constraints",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Fully qualified table name (schema.table), e.g. \"dbo.Users\" or \"api.Idiomas\""
        }
      },
      required: ["table_name"]
    }
  },
  
  // 2. PROCEDIMIENTO ALMACENADO - ANLISIS COMPLETO (consolidado)
  {
    name: "mcp_sp_structure",
    description: "Analyze SQL Server stored procedure structure including parameters, dependencies, and source code",
    inputSchema: {
      type: "object",
      properties: {
        sp_name: {
          type: "string",
          description: "Fully qualified stored procedure name (schema.name), e.g. \"eco.usp_Insert_EconomicMovement_v2\""
        }
      },
      required: ["sp_name"]
    }
  },
  
  // 3. DATOS - VISTA PREVIA MEJORADA (consolidado)
  {
    name: "mcp_preview_data",
    description: "Get a preview of data from a SQL Server table with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Fully qualified table name (schema.table), e.g. \"dbo.Users\""
        },
        filters: {
          type: "object",
          description: "Optional filters as column-value pairs, e.g. {\"Status\": \"Active\"}"
        },
        limit: {
          type: "number",
          description: "Maximum number of rows to return",
          default: 100,
          minimum: 1,
          maximum: 1000
        }
      },
      required: ["table_name"]
    }
  },
  
  // 4. COLUMNA - ESTADSTICAS COMPLETAS (consolidado)
  {
    name: "mcp_get_column_stats",
    description: "Get comprehensive statistics for a specific column in a table",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Fully qualified table name (schema.table), e.g. \"api.Idiomas\""
        },
        column_name: {
          type: "string",
          description: "Name of the column to analyze"
        }
      },
      required: ["table_name", "column_name"]
    }
  },
  
  // 5. SQL - EJECUTAR PROCEDIMIENTO (consolidado)
  {
    name: "mcp_execute_procedure",
    description: "Execute a SQL Server stored procedure with parameters and return results",
    inputSchema: {
      type: "object",
      properties: {
        sp_name: {
          type: "string",
          description: "Fully qualified stored procedure name (schema.name), e.g. \"api.usp_BusquedaByIdUnico_v2\""
        },
        params: {
          type: "object",
          description: "Parameters to pass to the stored procedure as key-value pairs"
        }
      },
      required: ["sp_name"]
    }
  },
  
  // 6. SQL - EJECUTAR CONSULTA (consolidado)
  {
    name: "mcp_execute_query",
    description: "Execute a raw SQL query and return the results",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The SQL query to execute. IMPORTANT: When referencing objects, use bracketed, schema-qualified names (e.g., SELECT * FROM [dbo].[Users])."
        }
      },
      required: ["query"]
    }
  },
  
  // 7. ANLISIS RPIDO DE DATOS (consolidado)
  {
    name: "mcp_quick_data_analysis",
    description: "Quick statistical analysis of a table including row count, column distributions, and top values",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Fully qualified table name (schema.table), e.g. \"dbo.Users\" or \"sales.OrderItems\""
        },
        sample_size: {
          type: "number",
          description: "Sample size for statistics calculation",
          default: 1000
        }
      },
      required: ["table_name"]
    }
  },
  
  // 8. BSQUEDA INTEGRAL (consolidado)
  {
    name: "mcp_search_comprehensive",
    description: "Search across database objects by name and definition with configurable criteria",
    inputSchema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Search pattern or text to find"
        },
        object_types: {
          type: "array",
          items: {
            type: "string",
            enum: ["TABLE", "VIEW", "PROCEDURE", "FUNCTION", "TRIGGER", "DEFAULT", "CHECK", "RULE"]
          },
          description: "Types of objects to search in"
        },
        search_in_names: {
          type: "boolean",
          description: "Whether to search in object names",
          default: true
        },
        search_in_definitions: {
          type: "boolean",
          description: "Whether to search in object definitions/source code",
          default: true
        }
      },
      required: ["pattern"]
    }
  },
  
  // 9. DEPENDENCIAS DE OBJETOS (consolidado)
  {
    name: "mcp_get_dependencies",
    description: "Get dependencies for a database object (tables, views, stored procedures, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        object_name: {
          type: "string",
          description: "Fully qualified object name (schema.name), e.g. \"api.Idiomas\""
        }
      },
      required: ["object_name"]
    }
  },
  
  // 10. VALORES DE MUESTRA (consolidado)
  {
    name: "mcp_get_sample_values",
    description: "Get sample values from a specific column in a table",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Fully qualified table name (schema.table), e.g. \"dbo.Users\""
        },
        column_name: {
          type: "string",
          description: "Name of the column to get sample values from"
        },
        limit: {
          type: "number",
          description: "Maximum number of distinct values to return",
          default: 10
        }
      },
      required: ["table_name", "column_name"]
    }
  },

  // 11. ESTADO DE SEGURIDAD (nuevo)
  {
    name: "mcp_get_security_status",
    description: "Get current security configuration and status for database operations",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  }
];
