# MCPQL Technical Reference Guide

This document provides comprehensive technical documentation for the 10 MCP tools in MCPQL, including implementation details, data structures, error handling, and advanced usage patterns for developers and database experts.

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

## Architecture Overview

### Connection Management
- **Connection Pool**: Uses `mssql.ConnectionPool` with automatic retry logic
- **Transaction Support**: All operations are wrapped in implicit transactions
- **Error Handling**: Comprehensive error catching with detailed SQL error codes
- **Security**: Parameterized queries prevent SQL injection

### Response Structure
All tools return a standardized response:
```typescript
interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  execution_time_ms?: number;
  sql_queries?: string[];
}
```

---

## 1. Table Analysis

### `mcp_table_analysis`

**Implementation**: `src/tools/tableAnalysis.ts`

**Technical Details:**
- Executes 5 parallel SQL queries against system catalog views
- Uses `INFORMATION_SCHEMA` and `sys` catalog views
- Handles partitioned tables and computed columns
- Supports temporal tables and columnstore indexes

**SQL Queries Executed:**
```sql
-- Column information
SELECT c.*, cc.definition as computed_definition
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN sys.computed_columns cc ON ...
WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @table

-- Primary/Foreign keys via sys.key_constraints
-- Indexes via sys.indexes and sys.index_columns  
-- Constraints via sys.check_constraints
-- Table metadata via sys.tables
```

**Input Schema:**
```typescript
interface TableAnalysisInput {
  table_name: string; // Format: [schema].[table] or schema.table
}
```

**Output Schema:**
```typescript
interface TableAnalysisOutput {
  columns: ColumnInfo[];
  primary_keys: PrimaryKeyInfo[];
  foreign_keys: ForeignKeyInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  table_info: TableMetadata;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  max_length: number;
  precision: number;
  scale: number;
  is_nullable: boolean;
  is_identity: boolean;
  is_computed: boolean;
  computed_definition: string | null;
  description: string | null;
  column_id: number;
  default_value: string;
}
```

**Advanced Usage:**
```typescript
// Handle complex table structures
const result = await mcp_table_analysis({
  table_name: "[dbo].[ComplexTable]"
});

if (result.success) {
  // Check for computed columns
  const computedCols = result.data.columns.filter(c => c.is_computed);
  
  // Analyze index coverage
  const clusterIndex = result.data.indexes.find(i => i.index_type === 'CLUSTERED');
  
  // Check constraints for business rules
  const checkConstraints = result.data.constraints.filter(c => 
    c.constraint_type === 'CHECK_CONSTRAINT'
  );
}
```

**Error Handling:**
- `InvalidObjectName`: Table doesn't exist
- `AccessDenied`: Insufficient permissions
- `SystemError`: Connection or SQL Server issues

---

## 2. Stored Procedure Analysis

### `mcp_sp_structure`

**Implementation**: `src/tools/storedProcedureAnalysis.ts`

**Technical Details:**
- Parses stored procedure metadata from `sys.procedures`
- Extracts parameters from `sys.parameters`
- Analyzes dependencies via `sys.sql_dependencies`
- Retrieves source code from `sys.sql_modules`

**SQL Queries Executed:**
```sql
-- Procedure metadata
SELECT p.*, m.definition
FROM sys.procedures p
JOIN sys.sql_modules m ON p.object_id = m.object_id
WHERE p.name = @proc_name AND SCHEMA_NAME(p.schema_id) = @schema

-- Parameters with detailed type information
SELECT p.*, t.name as type_name, t.max_length, t.precision, t.scale
FROM sys.parameters p
JOIN sys.types t ON p.user_type_id = t.user_type_id
WHERE p.object_id = @object_id

-- Dependencies analysis
SELECT d.*, o.name as referenced_name, s.name as referenced_schema
FROM sys.sql_dependencies d
JOIN sys.objects o ON d.referenced_major_id = o.object_id
JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE d.object_id = @object_id
```

**Input Schema:**
```typescript
interface SPAnalysisInput {
  sp_name: string; // Format: [schema].[procedure] or schema.procedure
}
```

**Output Schema:**
```typescript
interface SPAnalysisOutput {
  info: ProcedureInfo;
  parameters: ParameterInfo[];
  dependencies: DependencyInfo[];
  definition: string;
}

interface ParameterInfo {
  parameter_name: string;
  data_type: string;
  max_length: number;
  precision: number;
  scale: number;
  is_output: boolean;
  is_cursor_ref: boolean;
  has_default_value: boolean;
  default_value: string | null;
  parameter_id: number;
}
```

**Advanced Usage:**
```typescript
const result = await mcp_sp_structure({
  sp_name: "[api].[usp_ComplexProcedure]"
});

if (result.success) {
  // Analyze parameter complexity
  const outputParams = result.data.parameters.filter(p => p.is_output);
  const cursorParams = result.data.parameters.filter(p => p.is_cursor_ref);
  
  // Check for dynamic SQL usage
  const hasDynamicSQL = result.data.definition.includes('EXEC(') || 
                       result.data.definition.includes('sp_executesql');
  
  // Analyze dependencies for impact analysis
  const tableDeps = result.data.dependencies.filter(d => d.referenced_type === 'TABLE');
}
```

---

## 3. Data Preview

### `mcp_preview_data`

**Implementation**: `src/tools/dataOperations.ts`

**Technical Details:**
- Builds dynamic SQL with proper parameterization
- Handles complex WHERE clauses with type coercion
- Supports pagination with `OFFSET/FETCH`
- Automatic data type detection and conversion

**Dynamic SQL Generation:**
```sql
-- Generated query structure
SELECT TOP (@limit) *
FROM [@schema].[@table]
WHERE (@filter_conditions)
ORDER BY (SELECT NULL) -- Deterministic ordering
```

**Input Schema:**
```typescript
interface DataPreviewInput {
  table_name: string;
  filters?: Record<string, any>;
  limit?: number; // Max 1000, default 100
}
```

**Output Schema:**
```typescript
interface DataPreviewOutput {
  rows: Record<string, any>[];
  column_names: string[];
  total_filtered_rows?: number;
  has_more_data: boolean;
}
```

**Advanced Usage:**
```typescript
// Complex filtering with multiple data types
const result = await mcp_preview_data({
  table_name: "[sales].[Orders]",
  filters: {
    "OrderDate": "2023-01-01",           // Date filtering
    "TotalAmount": 1000,                 // Numeric filtering
    "Status": "Completed",               // String filtering
    "IsActive": true                     // Boolean filtering
  },
  limit: 500
});

// Handle large result sets
if (result.success && result.data.has_more_data) {
  console.log("Result set truncated - consider adding more filters");
}
```

**Type Coercion Rules:**
- **Dates**: ISO string → `DATETIME`/`DATE`
- **Numbers**: JavaScript number → `INT`/`DECIMAL`/`FLOAT`
- **Booleans**: `true`/`false` → `BIT`
- **Strings**: Direct parameterization with `NVARCHAR`

---

## 4. Column Statistics

### `mcp_get_column_stats`

**Implementation**: `src/tools/dataOperations.ts`

**Technical Details:**
- Executes data type-specific statistical queries
- Handles `NULL` values and data distribution analysis
- Supports all SQL Server data types including `GEOGRAPHY`, `GEOMETRY`
- Uses approximate algorithms for large datasets (`APPROX_COUNT_DISTINCT`)

**SQL Query Templates:**
```sql
-- Numeric columns
SELECT 
  MIN([@column]) as min_value,
  MAX([@column]) as max_value,
  AVG(CAST([@column] AS FLOAT)) as avg_value,
  STDEV(CAST([@column] AS FLOAT)) as std_deviation,
  COUNT(*) as total_count,
  COUNT([@column]) as non_null_count,
  APPROX_COUNT_DISTINCT([@column]) as approx_distinct_count
FROM [@schema].[@table]

-- String columns
SELECT 
  MIN(LEN([@column])) as min_length,
  MAX(LEN([@column])) as max_length,
  AVG(CAST(LEN([@column]) AS FLOAT)) as avg_length,
  COUNT(DISTINCT [@column]) as distinct_count
FROM [@schema].[@table]
WHERE [@column] IS NOT NULL
```

**Input Schema:**
```typescript
interface ColumnStatsInput {
  table_name: string;
  column_name: string;
}
```

**Output Schema:**
```typescript
interface ColumnStatsOutput {
  column_name: string;
  data_type: string;
  total_rows: number;
  null_count: number;
  null_percentage: number;
  distinct_count: number;
  
  // Numeric columns
  min_value?: number;
  max_value?: number;
  avg_value?: number;
  std_deviation?: number;
  
  // String columns
  min_length?: number;
  max_length?: number;
  avg_length?: number;
  
  // Date columns
  min_date?: string;
  max_date?: string;
  date_range_days?: number;
  
  // Most common values
  most_common_values: Array<{
    value: any;
    count: number;
    percentage: number;
  }>;
}
```

**Advanced Usage:**
```typescript
const result = await mcp_get_column_stats({
  table_name: "[analytics].[UserBehavior]",
  column_name: "SessionDuration"
});

if (result.success) {
  const stats = result.data;
  
  // Detect data quality issues
  if (stats.null_percentage > 50) {
    console.warn("High null percentage detected");
  }
  
  // Statistical analysis
  if (stats.std_deviation && stats.avg_value) {
    const coefficientOfVariation = stats.std_deviation / stats.avg_value;
    console.log(`Coefficient of variation: ${coefficientOfVariation}`);
  }
  
  // Outlier detection for numeric columns
  if (stats.min_value !== undefined && stats.max_value !== undefined) {
    const range = stats.max_value - stats.min_value;
    console.log(`Value range: ${range}`);
  }
}
```

---

## 5. Execute Stored Procedure

### `mcp_execute_procedure`

**Implementation**: `src/tools/dataOperations.ts`

**Technical Details:**
- Dynamic parameter binding with type inference
- Handles multiple result sets
- Captures output parameters and return values
- Supports cursor parameters and table-valued parameters

**Parameter Type Mapping:**
```typescript
const typeMapping = {
  'int': sql.Int,
  'bigint': sql.BigInt,
  'varchar': sql.VarChar,
  'nvarchar': sql.NVarChar,
  'datetime': sql.DateTime,
  'bit': sql.Bit,
  'decimal': sql.Decimal,
  'float': sql.Float,
  'uniqueidentifier': sql.UniqueIdentifier
};
```

**Input Schema:**
```typescript
interface ExecuteProcedureInput {
  sp_name: string;
  params?: Record<string, any>;
}
```

**Output Schema:**
```typescript
interface ExecuteProcedureOutput {
  resultsets: Array<{
    rows: Record<string, any>[];
    column_names: string[];
  }>;
  output_parameters: Record<string, any>;
  return_value: number;
  execution_time_ms: number;
}
```

**Advanced Usage:**
```typescript
// Complex procedure with multiple result sets and output parameters
const result = await mcp_execute_procedure({
  sp_name: "[reporting].[usp_GenerateReport]",
  params: {
    StartDate: "2023-01-01",
    EndDate: "2023-12-31",
    UserId: 12345,
    IncludeDetails: true,
    MaxRows: 10000
  }
});

if (result.success) {
  // Handle multiple result sets
  result.data.resultsets.forEach((rs, index) => {
    console.log(`Result set ${index + 1}: ${rs.rows.length} rows`);
  });
  
  // Access output parameters
  const outputParams = result.data.output_parameters;
  console.log(`Total processed: ${outputParams.TotalProcessed}`);
  
  // Check return value for error codes
  if (result.data.return_value !== 0) {
    console.warn(`Procedure returned error code: ${result.data.return_value}`);
  }
}
```

---

## 6. Execute SQL Query

### `mcp_execute_query`

**Implementation**: `src/tools/dataOperations.ts`

**Technical Details:**
- Direct SQL execution with connection pooling
- Query timeout management (30 seconds default)
- Memory-efficient streaming for large result sets
- SQL injection protection through input validation

**Security Features:**
- Blocks `DROP`, `DELETE`, `UPDATE`, `INSERT` without explicit override
- Validates schema-qualified object names
- Sanitizes dynamic SQL construction
- Connection-level permissions enforcement

**Input Schema:**
```typescript
interface ExecuteQueryInput {
  query: string; // Must use bracketed names: [schema].[table]
  timeout_ms?: number; // Default 30000
  max_rows?: number; // Default 10000
}
```

**Output Schema:**
```typescript
interface ExecuteQueryOutput {
  rows: Record<string, any>[];
  column_names: string[];
  rows_affected: number;
  execution_time_ms: number;
  query_plan?: string; // If SHOWPLAN_ALL is enabled
}
```

**Advanced Usage:**
```typescript
// Complex analytical query
const result = await mcp_execute_query({
  query: `
    WITH MonthlySales AS (
      SELECT 
        YEAR(OrderDate) as Year,
        MONTH(OrderDate) as Month,
        SUM(TotalAmount) as MonthlyTotal,
        COUNT(*) as OrderCount,
        AVG(TotalAmount) as AvgOrderValue
      FROM [sales].[Orders]
      WHERE OrderDate >= DATEADD(YEAR, -2, GETDATE())
      GROUP BY YEAR(OrderDate), MONTH(OrderDate)
    ),
    GrowthRates AS (
      SELECT *,
        LAG(MonthlyTotal) OVER (ORDER BY Year, Month) as PrevMonthTotal,
        (MonthlyTotal - LAG(MonthlyTotal) OVER (ORDER BY Year, Month)) / 
        LAG(MonthlyTotal) OVER (ORDER BY Year, Month) * 100 as GrowthRate
      FROM MonthlySales
    )
    SELECT * FROM GrowthRates
    WHERE GrowthRate IS NOT NULL
    ORDER BY Year DESC, Month DESC
  `,
  timeout_ms: 60000,
  max_rows: 50
});

if (result.success) {
  // Process complex analytical results
  const salesData = result.data.rows;
  const avgGrowthRate = salesData.reduce((sum, row) => sum + row.GrowthRate, 0) / salesData.length;
  console.log(`Average monthly growth rate: ${avgGrowthRate.toFixed(2)}%`);
}
```

---

## 7. Quick Data Analysis

### `mcp_quick_data_analysis`

**Implementation**: `src/tools/dataOperations.ts`

**Technical Details:**
- Parallel execution of multiple analytical queries
- Sampling strategy for large tables (systematic sampling)
- Automatic data type detection and appropriate statistics
- Memory-efficient processing with streaming

**Sampling Algorithm:**
```sql
-- For tables > sample_size, use systematic sampling
WITH SampledData AS (
  SELECT *, 
    ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as rn,
    @total_rows as total_count
  FROM [@schema].[@table]
)
SELECT * FROM SampledData
WHERE rn % (@total_rows / @sample_size) = 1
```

**Input Schema:**
```typescript
interface QuickAnalysisInput {
  table_name: string;
  sample_size?: number; // Default 1000, max 10000
  include_histograms?: boolean; // Default false
}
```

**Output Schema:**
```typescript
interface QuickAnalysisOutput {
  table_info: {
    total_rows: number;
    sample_size: number;
    sampling_ratio: number;
    analysis_timestamp: string;
  };
  column_analysis: Record<string, ColumnAnalysis>;
  data_quality_score: number; // 0-100
  recommendations: string[];
}

interface ColumnAnalysis {
  data_type: string;
  null_percentage: number;
  distinct_count: number;
  cardinality_ratio: number;
  
  // Statistics by type
  numeric_stats?: NumericStats;
  string_stats?: StringStats;
  date_stats?: DateStats;
  
  // Data quality indicators
  quality_issues: string[];
  suggested_indexes?: string[];
}
```

**Advanced Usage:**
```typescript
const result = await mcp_quick_data_analysis({
  table_name: "[warehouse].[FactSales]",
  sample_size: 5000,
  include_histograms: true
});

if (result.success) {
  const analysis = result.data;
  
  // Data quality assessment
  console.log(`Overall data quality score: ${analysis.data_quality_score}/100`);
  
  // Column-specific analysis
  Object.entries(analysis.column_analysis).forEach(([col, stats]) => {
    if (stats.quality_issues.length > 0) {
      console.log(`${col}: ${stats.quality_issues.join(', ')}`);
    }
    
    // Cardinality analysis for indexing recommendations
    if (stats.cardinality_ratio > 0.95) {
      console.log(`${col}: High cardinality - consider for unique index`);
    } else if (stats.cardinality_ratio < 0.1) {
      console.log(`${col}: Low cardinality - consider for filtered index`);
    }
  });
  
  // Performance recommendations
  analysis.recommendations.forEach(rec => console.log(`Recommendation: ${rec}`));
}
```

---

## 8. Comprehensive Search

### `mcp_search_comprehensive`

**Implementation**: `src/tools/objectSearch.ts`

**Technical Details:**
- Full-text search across system catalog views
- Regex pattern matching with SQL `LIKE` and `PATINDEX`
- Parallel search across multiple object types
- Relevance scoring based on match location and frequency

**Search Algorithms:**
```sql
-- Object name search
SELECT o.name, s.name as schema_name, o.type_desc
FROM sys.objects o
JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.name LIKE '%' + @pattern + '%'
  AND o.type IN (@object_types)

-- Definition search (stored procedures, functions, views)
SELECT o.name, s.name as schema_name, o.type_desc,
  LEN(m.definition) - LEN(REPLACE(UPPER(m.definition), UPPER(@pattern), '')) 
  / LEN(@pattern) as match_count
FROM sys.objects o
JOIN sys.schemas s ON o.schema_id = s.schema_id
JOIN sys.sql_modules m ON o.object_id = m.object_id
WHERE UPPER(m.definition) LIKE '%' + UPPER(@pattern) + '%'
  AND o.type IN (@object_types)
```

**Input Schema:**
```typescript
interface SearchInput {
  pattern: string;
  object_types?: ObjectType[]; // Default: all types
  search_in_names?: boolean; // Default: true
  search_in_definitions?: boolean; // Default: true
  case_sensitive?: boolean; // Default: false
  regex_mode?: boolean; // Default: false
}

type ObjectType = 'TABLE' | 'VIEW' | 'PROCEDURE' | 'FUNCTION' | 'TRIGGER' | 'DEFAULT' | 'CHECK' | 'RULE';
```

**Output Schema:**
```typescript
interface SearchOutput {
  name_matches: SearchMatch[];
  definition_matches: SearchMatch[];
  total_matches: number;
  search_statistics: {
    objects_searched: number;
    search_time_ms: number;
    pattern_complexity: 'simple' | 'moderate' | 'complex';
  };
}

interface SearchMatch {
  object_name: string;
  schema_name: string;
  object_type: string;
  match_count: number;
  relevance_score: number;
  match_context?: string; // Surrounding text for definition matches
}
```

**Advanced Usage:**
```typescript
// Complex search with regex patterns
const result = await mcp_search_comprehensive({
  pattern: "Customer.*Order",
  object_types: ["TABLE", "VIEW", "PROCEDURE"],
  search_in_names: true,
  search_in_definitions: true,
  regex_mode: true
});

if (result.success) {
  // Sort by relevance
  const sortedMatches = [...result.data.name_matches, ...result.data.definition_matches]
    .sort((a, b) => b.relevance_score - a.relevance_score);
  
  // Analyze search patterns
  const tableMatches = sortedMatches.filter(m => m.object_type === 'TABLE');
  const procMatches = sortedMatches.filter(m => m.object_type === 'PROCEDURE');
  
  console.log(`Found ${tableMatches.length} tables and ${procMatches.length} procedures`);
}
```

---

## 9. Object Dependencies

### `mcp_get_dependencies`

**Implementation**: `src/tools/objectSearch.ts`

**Technical Details:**
- Analyzes both hard and soft dependencies
- Traverses dependency graph with cycle detection
- Handles cross-database dependencies
- Supports dependency impact analysis

**Dependency Analysis Queries:**
```sql
-- Direct dependencies (sys.sql_dependencies)
SELECT 
  d.class_desc,
  d.referenced_major_id,
  d.referenced_minor_id,
  OBJECT_SCHEMA_NAME(d.referenced_major_id) as referenced_schema,
  OBJECT_NAME(d.referenced_major_id) as referenced_object,
  o.type_desc as referenced_type
FROM sys.sql_dependencies d
LEFT JOIN sys.objects o ON d.referenced_major_id = o.object_id
WHERE d.object_id = @object_id

-- Modern dependencies (sys.dm_sql_referenced_entities)
SELECT 
  re.referenced_schema_name,
  re.referenced_entity_name,
  re.referenced_class_desc,
  re.is_caller_dependent,
  re.is_ambiguous
FROM sys.dm_sql_referenced_entities(@object_name, 'OBJECT') re
```

**Input Schema:**
```typescript
interface DependenciesInput {
  object_name: string;
  include_indirect?: boolean; // Default: false
  max_depth?: number; // Default: 3
}
```

**Output Schema:**
```typescript
interface DependenciesOutput {
  object_info: {
    name: string;
    schema: string;
    type: string;
    exists: boolean;
  };
  direct_dependencies: Dependency[];
  indirect_dependencies?: Dependency[];
  reverse_dependencies: Dependency[];
  dependency_graph?: DependencyNode[];
  circular_dependencies?: string[];
}

interface Dependency {
  referenced_schema: string;
  referenced_name: string;
  referenced_type: string;
  dependency_type: 'HARD' | 'SOFT' | 'SCHEMA_BOUND';
  is_ambiguous: boolean;
  depth_level: number;
}
```

**Advanced Usage:**
```typescript
const result = await mcp_get_dependencies({
  object_name: "[sales].[vw_CustomerOrders]",
  include_indirect: true,
  max_depth: 5
});

if (result.success) {
  const deps = result.data;
  
  // Impact analysis
  if (deps.circular_dependencies && deps.circular_dependencies.length > 0) {
    console.warn("Circular dependencies detected:", deps.circular_dependencies);
  }
  
  // Dependency depth analysis
  const maxDepth = Math.max(...deps.indirect_dependencies.map(d => d.depth_level));
  console.log(`Maximum dependency depth: ${maxDepth}`);
  
  // Critical dependencies (schema-bound)
  const criticalDeps = deps.direct_dependencies.filter(d => 
    d.dependency_type === 'SCHEMA_BOUND'
  );
  console.log(`Critical dependencies: ${criticalDeps.length}`);
}
```

---

## 10. Sample Values

### `mcp_get_sample_values`

**Implementation**: `src/tools/dataOperations.ts`

**Technical Details:**
- Stratified sampling for representative data
- Handles large text and binary columns
- Frequency-based sampling with statistical significance
- Data type-aware formatting

**Sampling Strategy:**
```sql
-- Frequency-based sampling
WITH ValueFrequency AS (
  SELECT 
    [@column] as value,
    COUNT(*) as frequency,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
  FROM [@schema].[@table]
  WHERE [@column] IS NOT NULL
  GROUP BY [@column]
),
RankedValues AS (
  SELECT *,
    ROW_NUMBER() OVER (ORDER BY frequency DESC) as rank
  FROM ValueFrequency
)
SELECT TOP (@limit) 
  value,
  frequency,
  percentage
FROM RankedValues
ORDER BY frequency DESC
```

**Input Schema:**
```typescript
interface SampleValuesInput {
  table_name: string;
  column_name: string;
  limit?: number; // Default: 10, max: 100
  include_frequency?: boolean; // Default: true
  min_frequency?: number; // Default: 1
}
```

**Output Schema:**
```typescript
interface SampleValuesOutput {
  column_info: {
    name: string;
    data_type: string;
    max_length: number;
    is_nullable: boolean;
  };
  sample_values: Array<{
    value: any;
    frequency: number;
    percentage: number;
    formatted_value: string;
  }>;
  statistics: {
    total_rows: number;
    distinct_values: number;
    null_count: number;
    sample_coverage: number; // Percentage of total data represented
  };
  has_more_values: boolean;
}
```

**Advanced Usage:**
```typescript
const result = await mcp_get_sample_values({
  table_name: "[analytics].[UserEvents]",
  column_name: "EventType",
  limit: 25,
  include_frequency: true,
  min_frequency: 10
});

if (result.success) {
  const samples = result.data;
  
  // Data distribution analysis
  const topValues = samples.sample_values.slice(0, 5);
  const coverageByTop5 = topValues.reduce((sum, v) => sum + v.percentage, 0);
  
  console.log(`Top 5 values cover ${coverageByTop5.toFixed(1)}% of data`);
  
  // Outlier detection
  const outliers = samples.sample_values.filter(v => v.percentage < 0.1);
  console.log(`Found ${outliers.length} rare values (< 0.1% frequency)`);
  
  // Data quality assessment
  if (samples.statistics.sample_coverage < 80) {
    console.warn("Sample may not be representative - consider increasing limit");
  }
}
```

---

## Performance Optimization

### Connection Pool Configuration
```typescript
const poolConfig = {
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
};
```

### Query Optimization Tips
1. **Use schema-qualified names**: `[schema].[table]` format
2. **Limit result sets**: Always specify reasonable limits
3. **Use appropriate sampling**: For large tables, use sampling parameters
4. **Index awareness**: Tools provide index recommendations
5. **Parallel execution**: Multiple tools can run simultaneously

### Memory Management
- **Streaming results**: Large result sets are processed in chunks
- **Connection pooling**: Automatic connection reuse
- **Garbage collection**: Explicit cleanup of large objects
- **Memory monitoring**: Built-in memory usage tracking

---

## Error Handling Reference

### Common Error Codes
- `INVALID_OBJECT_NAME`: Object doesn't exist or access denied
- `INVALID_COLUMN_NAME`: Column doesn't exist in specified table
- `TIMEOUT_EXCEEDED`: Query execution timeout
- `MEMORY_LIMIT_EXCEEDED`: Result set too large
- `PERMISSION_DENIED`: Insufficient database permissions
- `CONNECTION_FAILED`: Database connection issues
- `INVALID_PARAMETER`: Parameter validation failed

### Error Recovery Strategies
```typescript
try {
  const result = await mcp_table_analysis({ table_name: "invalid.table" });
} catch (error) {
  if (error.code === 'INVALID_OBJECT_NAME') {
    // Handle missing table
    console.log("Table not found - checking similar names...");
    const searchResult = await mcp_search_comprehensive({ 
      pattern: "table",
      object_types: ["TABLE"] 
    });
  }
}
```

---

## Best Practices for Experts

### 1. Schema Design Analysis
```typescript
// Comprehensive table analysis workflow
const analyzeTableDesign = async (tableName: string) => {
  const [structure, stats, dependencies] = await Promise.all([
    mcp_table_analysis({ table_name: tableName }),
    mcp_quick_data_analysis({ table_name: tableName }),
    mcp_get_dependencies({ object_name: tableName })
  ]);
  
  // Analyze normalization
  const pkCols = structure.data.primary_keys.length;
  const fkCols = structure.data.foreign_keys.length;
  const totalCols = structure.data.columns.length;
  
  return {
    normalization_score: (fkCols / totalCols) * 100,
    index_coverage: structure.data.indexes.length,
    data_quality: stats.data.data_quality_score,
    dependency_complexity: dependencies.data.direct_dependencies.length
  };
};
```

### 2. Performance Monitoring
```typescript
// Query performance analysis
const analyzeQueryPerformance = async (query: string) => {
  const startTime = Date.now();
  
  const result = await mcp_execute_query({
    query: `SET STATISTICS IO ON; ${query}`,
    timeout_ms: 120000
  });
  
  const executionTime = Date.now() - startTime;
  
  return {
    execution_time_ms: executionTime,
    rows_returned: result.data.rows.length,
    performance_ratio: result.data.rows.length / executionTime
  };
};
```

### 3. Data Quality Assessment
```typescript
// Comprehensive data quality check
const assessDataQuality = async (tableName: string) => {
  const analysis = await mcp_quick_data_analysis({ table_name: tableName });
  
  const qualityMetrics = {
    completeness: 0,
    consistency: 0,
    accuracy: 0,
    timeliness: 0
  };
  
  // Calculate completeness (null percentage)
  const avgNullPercentage = Object.values(analysis.data.column_analysis)
    .reduce((sum, col) => sum + col.null_percentage, 0) / 
    Object.keys(analysis.data.column_analysis).length;
  
  qualityMetrics.completeness = 100 - avgNullPercentage;
  
  return qualityMetrics;
};
```

---

## Integration Patterns

### 1. Database Migration Analysis
```typescript
const analyzeMigrationImpact = async (objectName: string) => {
  const deps = await mcp_get_dependencies({ 
    object_name: objectName,
    include_indirect: true,
    max_depth: 10
  });
  
  // Identify all affected objects
  const affectedObjects = new Set([
    ...deps.data.direct_dependencies.map(d => `${d.referenced_schema}.${d.referenced_name}`),
    ...deps.data.reverse_dependencies.map(d => `${d.referenced_schema}.${d.referenced_name}`)
  ]);
  
  return {
    total_affected: affectedObjects.size,
    migration_complexity: deps.data.circular_dependencies?.length > 0 ? 'HIGH' : 'MEDIUM',
    affected_objects: Array.from(affectedObjects)
  };
};
```

### 2. Security Audit Trail
```typescript
const auditTableAccess = async (tableName: string) => {
  // Find all procedures that access this table
  const procedures = await mcp_search_comprehensive({
    pattern: tableName.split('.')[1], // Table name without schema
    object_types: ['PROCEDURE'],
    search_in_definitions: true
  });
  
  // Analyze access patterns
  const accessAnalysis = {
    total_procedures: procedures.data.definition_matches.length,
    direct_access: procedures.data.definition_matches.filter(m => 
      m.match_context?.includes('SELECT') || 
      m.match_context?.includes('INSERT') ||
      m.match_context?.includes('UPDATE') ||
      m.match_context?.includes('DELETE')
    ).length
  };
  
  return accessAnalysis;
};
```

This technical guide provides comprehensive implementation details for expert-level usage of MCPQL tools, including advanced patterns, performance optimization, and integration strategies.
