# MCPQL Tools Documentation

This document provides detailed information about the 10 consolidated tools available in the MCPQL project, including descriptions, input parameters, and usage examples.

## Table of Contents

1. [Table Analysis](#1-table-analysis)
2. [Stored Procedure Analysis](#2-stored-procedure-analysis)
3. [Data Preview](#3-data-preview)
4. [Column Statistics](#4-column-statistics)
5. [Execute Stored Procedure](#5-execute-stored-procedure)
6. [Execute SQL Query](#6-execute-sql-query)
7. [Quick Data Analysis](#7-quick-data-analysis)
8. [Comprehensive Search](#8-comprehensive-search)
9. [Object Dependencies](#9-object-dependencies)
10. [Sample Values](#10-sample-values)

---

## 1. Table Analysis

### `mcp_table_analysis`

**Description:**
Performs a comprehensive analysis of a SQL Server table, including its structure, columns, keys, indexes, and constraints. This consolidated tool replaces multiple individual table analysis functions.

**Input Parameters:**
- `table_name`: Fully qualified table name in format schema.table (e.g., "dbo.Users" or "api.Idiomas")

**Example:**

```javascript
const result = await mcp_table_analysis({ 
    table_name: "[api].[Idiomas]" 
});

if (result.success) {
    const { 
        columns, 
        primary_keys, 
        foreign_keys, 
        indexes, 
        constraints, 
        table_info 
    } = result.data;
    
    console.log(`Table has ${columns.length} columns and ${indexes.length} indexes`);
}
```

**Returns:**
A comprehensive object containing:
- `columns`: Column definitions and metadata
- `primary_keys`: Primary key information
- `foreign_keys`: Foreign key relationships
- `indexes`: Table indexes
- `constraints`: Table constraints
- `table_info`: General table metadata

---

## 2. Stored Procedure Analysis

### `mcp_sp_structure`

**Description:**
Analyzes a SQL Server stored procedure's structure, including its parameters, dependencies, and source code. This consolidated tool replaces multiple individual stored procedure analysis functions.

**Input Parameters:**
- `sp_name`: Fully qualified stored procedure name in format schema.name (e.g., "eco.usp_Insert_EconomicMovement_v2")

**Example:**

```javascript
const result = await mcp_sp_structure({ 
    sp_name: "[api].[usp_BusquedaByIdUnico_v2]" 
});

if (result.success) {
    const { 
        info, 
        parameters, 
        dependencies, 
        definition 
    } = result.data;
    
    console.log(`Procedure has ${parameters.length} parameters`);
    console.log(`Definition: ${definition.substring(0, 100)}...`);
}
```

**Returns:**
A comprehensive object containing:
- `info`: General procedure metadata
- `parameters`: Parameter definitions
- `dependencies`: Objects this procedure depends on
- `definition`: Source code of the procedure

---

## 3. Data Preview

### `mcp_preview_data`

**Description:**
Gets a preview of data from a SQL Server table with optional filters. This tool helps you quickly explore the actual content of tables.

**Input Parameters:**
- `table_name`: Fully qualified table name in format schema.table (e.g., "dbo.Users")
- `filters`: (Optional) Filters as column-value pairs (e.g., {"Status": "Active"})
- `limit`: (Optional) Maximum number of rows to return (default: 100, max: 1000)

**Example:**

```javascript
// Basic usage
const result = await mcp_preview_data({ 
    table_name: "[dbo].[Users]" 
});

// With filters and limit
const filteredResult = await mcp_preview_data({ 
    table_name: "[dbo].[Users]",
    filters: { "IsActive": true },
    limit: 50
});

if (result.success) {
    console.log(`Retrieved ${result.data.rows.length} rows`);
    console.table(result.data.rows);
}
```

**Returns:**
- `rows`: Array of data rows
- `column_names`: Array of column names in the result set

---

## 4. Column Statistics

### `mcp_get_column_stats`

**Description:**
Gets comprehensive statistics for a specific column in a table, helping you understand data distribution and characteristics.

**Input Parameters:**
- `table_name`: Fully qualified table name in format schema.table (e.g., "api.Idiomas")
- `column_name`: Name of the column to analyze

**Example:**

```javascript
const result = await mcp_get_column_stats({ 
    table_name: "[dbo].[OrderItems]",
    column_name: "Price"
});

if (result.success) {
    const stats = result.data;
    console.log(`Min: ${stats.min}, Max: ${stats.max}, Avg: ${stats.avg}`);
    console.log(`Null percentage: ${stats.null_percentage}%`);
}
```

**Returns:**
Statistics including:
- `min`, `max`, `avg`: Numeric values for applicable columns
- `most_common`: Most frequently occurring values
- `null_percentage`: Percentage of null values
- `distinct_count`: Count of distinct values
- Additional type-specific statistics

---

## 5. Execute Stored Procedure

### `mcp_execute_procedure`

**Description:**
Executes a SQL Server stored procedure with parameters and returns the results. This is useful for testing and working with stored procedures.

**Input Parameters:**
- `sp_name`: Fully qualified stored procedure name in format schema.name (e.g., "api.usp_BusquedaByIdUnico_v2")
- `params`: (Optional) Parameters to pass to the stored procedure as key-value pairs

**Example:**

```javascript
// Simple execution
const result = await mcp_execute_procedure({ 
    sp_name: "[api].[usp_GetUserById]"
});

// With parameters
const paramResult = await mcp_execute_procedure({ 
    sp_name: "[api].[usp_GetUserById]",
    params: {
        UserId: 123,
        IncludeInactive: false
    }
});

if (paramResult.success) {
    console.log(`Retrieved ${paramResult.data.resultsets[0].rows.length} rows`);
    console.table(paramResult.data.resultsets[0].rows);
}
```

**Returns:**
- `resultsets`: Array of result sets, each containing:
  - `rows`: The data rows
  - `column_names`: Column names in the result set
- `output_parameters`: Any output parameters returned by the procedure
- `return_value`: The stored procedure's return value

---

## 6. Execute SQL Query

### `mcp_execute_query`

**Description:**
Executes a raw SQL query and returns the results. This gives you the flexibility to run any SQL statement.

**Input Parameters:**
- `query`: The SQL query to execute. Use bracketed, schema-qualified names (e.g., SELECT * FROM [dbo].[Users])

**Example:**

```javascript
const result = await mcp_execute_query({ 
    query: "SELECT TOP 10 OrderId, CustomerName, OrderDate FROM [sales].[Orders] WHERE OrderTotal > 1000 ORDER BY OrderDate DESC" 
});

if (result.success) {
    console.log(`Retrieved ${result.data.rows.length} orders`);
    console.table(result.data.rows);
}
```

**Returns:**
- `rows`: Array of data rows
- `column_names`: Array of column names in the result set

---

## 7. Quick Data Analysis

### `mcp_quick_data_analysis`

**Description:**
Provides a quick statistical analysis of a table including row count, column distributions, and top values. This is useful for getting a comprehensive overview of a table's data.

**Input Parameters:**
- `table_name`: Fully qualified table name in format schema.table (e.g., "dbo.Users" or "sales.OrderItems")
- `sample_size`: (Optional) Sample size for statistics calculation (default: 1000)

**Example:**

```javascript
const result = await mcp_quick_data_analysis({ 
    table_name: "[sales].[OrderItems]",
    sample_size: 2000
});

if (result.success) {
    const analysis = result.data;
    console.log(`Table has ${analysis.row_count} total rows`);
    console.log(`Analyzed using a sample of ${analysis.sample_size} rows`);
    
    // Access column statistics
    console.log(`Column distributions:`, analysis.column_stats);
    
    // Access most common values
    console.log(`Most common values in 'Status':`, analysis.top_values.Status);
}
```

**Returns:**
- `row_count`: Total rows in the table
- `sample_size`: Size of sample used for analysis
- `column_stats`: Statistics for each column
- `top_values`: Most common values by column
- `null_percentages`: Percentage of NULL values by column

---

## 8. Comprehensive Search

### `mcp_search_comprehensive`

**Description:**
Searches across database objects by name and definition with configurable criteria. This tool helps you find database objects containing specific text patterns.

**Input Parameters:**
- `pattern`: Search pattern or text to find
- `object_types`: (Optional) Types of objects to search in (TABLE, VIEW, PROCEDURE, FUNCTION, TRIGGER, DEFAULT, CHECK, RULE)
- `search_in_names`: (Optional) Whether to search in object names (default: true)
- `search_in_definitions`: (Optional) Whether to search in object definitions/source code (default: true)

**Example:**

```javascript
// Basic search
const result = await mcp_search_comprehensive({ 
    pattern: "Customer" 
});

// Advanced search
const advancedResult = await mcp_search_comprehensive({ 
    pattern: "Invoice",
    object_types: ["TABLE", "VIEW", "PROCEDURE"],
    search_in_names: true,
    search_in_definitions: false
});

if (result.success) {
    console.log(`Total matches: ${result.data.total_matches}`);
    console.log(`Name matches: ${result.data.name_matches.length}`);
    console.log(`Definition matches: ${result.data.definition_matches.length}`);
}
```

**Returns:**
- `name_matches`: Objects whose names match the pattern
- `definition_matches`: Objects whose definitions match the pattern
- `total_matches`: Total number of matches found

---

## 9. Object Dependencies

### `mcp_get_dependencies`

**Description:**
Gets dependencies for a database object such as tables, views, stored procedures, etc. This helps you understand how objects relate to each other.

**Input Parameters:**
- `object_name`: Fully qualified object name in format schema.name (e.g., "api.Idiomas")

**Example:**

```javascript
const result = await mcp_get_dependencies({ 
    object_name: "[dbo].[CustomerOrders]" 
});

if (result.success) {
    console.log(`Object has ${result.data.references_from.length} dependencies`);
    console.log(`Object is referenced by ${result.data.references_to.length} other objects`);
    
    // Check dependencies
    result.data.references_from.forEach(dep => {
        console.log(`Depends on: ${dep.referenced_entity_name} (${dep.referenced_entity_type})`);
    });
}
```

**Returns:**
- `references_from`: Objects that this object depends on
- `references_to`: Objects that depend on this object

---

## 10. Sample Values

### `mcp_get_sample_values`

**Description:**
Gets sample values from a specific column in a table. This is useful for quickly seeing what kind of data a column contains.

**Input Parameters:**
- `table_name`: Fully qualified table name in format schema.table (e.g., "dbo.Users")
- `column_name`: Name of the column to get sample values from
- `limit`: (Optional) Maximum number of distinct values to return (default: 10)

**Example:**

```javascript
const result = await mcp_get_sample_values({ 
    table_name: "[dbo].[Products]",
    column_name: "Category",
    limit: 20
});

if (result.success) {
    console.log(`Sample values for Category column:`);
    result.data.values.forEach(val => console.log(` - ${val}`));
    
    if (result.data.has_more) {
        console.log("There are more distinct values than shown");
    }
}
```

**Returns:**
- `values`: Array of sample distinct values from the column
- `has_more`: Boolean indicating if there are more distinct values than the requested limit
- `total_distinct`: Total number of distinct values in the column

---

## Best Practices

1. **Use Schema-Qualified Names**: Always use fully qualified table and object names in format `[schema].[name]` for most reliable results.

2. **Start With Analysis Tools**: Before working with data, use the analysis tools like `mcp_table_analysis` and `mcp_sp_structure` to understand the structure.

3. **Limit Data Retrieval**: When previewing data, use filters and reasonable limits to avoid retrieving too much data.

4. **Search Optimization**: When using `mcp_search_comprehensive`, narrow down your search with object types to get more relevant results.

5. **Parameter Types**: Make sure to pass parameters to stored procedures with the correct JavaScript types (numbers for numeric parameters, etc.).
