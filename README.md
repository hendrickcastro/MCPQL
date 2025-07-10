# MCPQL - SQL Server MCP Proxy

A comprehensive **Model Context Protocol (MCP)** server for **SQL Server** database operations, providing complete Python-equivalent functionality for database analysis, object discovery, and data manipulation.

## 🌟 Features

### 🏗️ **Core Database Operations**
- **Query Execution**: Execute custom SQL queries with full error handling
- **Table Analysis**: Comprehensive table structure analysis including columns, keys, indexes, and constraints
- **Stored Procedure Analysis**: Complete stored procedure inspection with parameters, dependencies, and source code
- **Data Preview**: Enhanced data viewing with filtering and formatting capabilities

### 🔍 **ObjectSearch - Database Object Discovery (VERY IMPORTANT)**
- **Search by Name**: Find database objects by name patterns with type filtering
- **Search in Definitions**: Search for patterns within object source code/definitions
- **Search by Type**: List all objects of specific types (tables, procedures, views, functions, triggers)
- **Dependency Analysis**: Comprehensive dependency tracking for database objects
- **Comprehensive Search**: Combined name and definition search with detailed results

### 🎨 **QuickView - Data Analysis & Preview**
- **Enhanced Data Preview**: Formatted data preview with binary data handling
- **Sample Values**: Get distinct sample values from specific columns
- **Column Statistics**: Comprehensive column analysis with statistics and sample data
- **Quick Analysis**: Complete table analysis including preview, column info, and row counts

### 📊 **Advanced Analysis Functions**
- **TableInfo Class Equivalent**: Complete Python `TableInfo` functionality
  - Individual granular functions for columns, primary keys, foreign keys, indexes, constraints
  - All-in-one table analysis function
- **StoredProcedureStructure Class Equivalent**: Complete Python `StoredProcedureStructure` functionality
  - Enhanced SP analysis with comprehensive info, parameters, and dependencies
  - Complete structure analysis using all individual functions
- **StoredProcedureInfo Class Equivalent**: Complete Python `StoredProcedureInfo` functionality
  - Simple SP analysis functions matching Python's `get_all_info` method

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- SQL Server database with appropriate connection credentials
- MCP-compatible client (like Cursor IDE)

### Setup
1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd MCPQL
npm install
```

2. **Configure database connection:**
Edit `src/db.ts` with your SQL Server connection details:
```typescript
const config: sql.config = {
  server: 'your-server',
  database: 'your-database',
  user: 'your-username',
  password: 'your-password',
  // ... other options
};
```

3. **Build the project:**
```bash
npm run build
```

4. **Configure MCP client:**
Add to your MCP client configuration (e.g., Cursor settings):
```json
{
  "mcpServers": {
    "mcpql": {
      "command": "node",
      "args": ["path/to/MCPQL/dist/server.js"]
    }
  }
}
```

## 🛠️ Available Tools

### 🔍 **ObjectSearch Functions** (VERY IMPORTANT for Database Discovery)

#### `mcp_search_objects_by_name`
Search database objects by name pattern with optional type filtering.
```typescript
// Find all objects containing "User" in the name
mcp_search_objects_by_name({ 
  pattern: "User",
  object_types: ["U", "P"] // Tables and Procedures only
})
```

#### `mcp_search_in_definitions`
Search for patterns within object definitions/source code.
```typescript
// Find all procedures containing "SELECT * FROM Users"
mcp_search_in_definitions({ 
  pattern: "SELECT * FROM Users",
  object_types: ["P"] // Procedures only
})
```

#### `mcp_search_objects_by_type`
List all objects of a specific type.
```typescript
// Get all tables in the database
mcp_search_objects_by_type({ 
  object_type: "TABLE" 
})
```

#### `mcp_get_object_dependencies`
Get comprehensive dependencies for a database object.
```typescript
// Get all dependencies for a specific procedure
mcp_get_object_dependencies({ 
  object_name: "[dbo].[usp_GetUserData]" 
})
```

#### `mcp_search_comprehensive`
Perform comprehensive search in both names and definitions.
```typescript
// Search for "Customer" in both names and definitions
mcp_search_comprehensive({ 
  pattern: "Customer",
  search_in_names: true,
  search_in_definitions: true,
  object_types: ["U", "P", "V"] // Tables, Procedures, Views
})
```

### 🎨 **QuickView Functions** (Enhanced Data Analysis)

#### `mcp_preview_data_enhanced`
Enhanced data preview with better formatting and binary data handling.
```typescript
// Preview table data with filters
mcp_preview_data_enhanced({ 
  table_name: "[dbo].[Users]",
  filters: { "Status": "Active" },
  limit: 50
})
```

#### `mcp_get_sample_values`
Get distinct sample values from a specific column.
```typescript
// Get sample values from a column
mcp_get_sample_values({ 
  table_name: "[dbo].[Users]",
  column_name: "Department",
  limit: 10
})
```

#### `mcp_get_column_stats_enhanced`
Get comprehensive column statistics including sample values.
```typescript
// Get detailed statistics for a column
mcp_get_column_stats_enhanced({ 
  table_name: "[dbo].[Users]",
  column_name: "Age"
})
```

#### `mcp_quick_data_analysis`
Quick comprehensive data analysis including preview, column info, and row count.
```typescript
// Get complete table overview
mcp_quick_data_analysis({ 
  table_name: "[dbo].[Users]",
  limit: 100
})
```

### 📊 **Core Database Functions**

#### Table Analysis Functions (Python TableInfo Equivalent)
- `mcp_table_analysis` - Complete table structure analysis
- `mcp_get_columns` - Detailed column information
- `mcp_get_primary_keys` - Primary key constraints
- `mcp_get_foreign_keys` - Foreign key relationships
- `mcp_get_indexes` - Index information
- `mcp_get_constraints` - Check and default constraints
- `mcp_get_all_table_info` - Complete table analysis in one call

#### Stored Procedure Analysis Functions

**StoredProcedureStructure Equivalent (Enhanced):**
- `mcp_sp_structure` - Enhanced SP analysis
- `mcp_get_sp_info` - Basic SP information
- `mcp_get_sp_parameters` - Detailed parameter info
- `mcp_get_sp_dependencies` - Enhanced dependency analysis
- `mcp_get_sp_definition` - Complete source code
- `mcp_get_sp_complete_structure` - All-in-one comprehensive analysis

**StoredProcedureInfo Equivalent (Simple):**
- `mcp_get_sp_definition_simple` - Simple definition retrieval
- `mcp_get_sp_parameters_simple` - Basic parameter information
- `mcp_get_sp_dependencies_simple` - Simple dependencies
- `mcp_get_sp_all_info_simple` - All info in one call (matches Python's `get_all_info`)

#### Data Operations
- `mcp_execute_query` - Execute custom SQL queries
- `mcp_preview_data` - Basic data preview with filtering
- `mcp_execute_procedure` - Execute stored procedures with parameters
- `mcp_get_dependencies` - Get object dependencies
- `mcp_get_column_stats` - Basic column statistics

## 🎯 **Object Type Codes**
- **U** = Table (User Table)
- **P** = Stored Procedure
- **V** = View
- **FN** = Scalar Function
- **IF** = Inline Table Function
- **TF** = Table Function
- **TR** = Trigger

## 📋 **Usage Examples**

### Finding Database Objects
```typescript
// Find all user-related objects
const objects = await mcp_search_objects_by_name({ 
  pattern: "User" 
});

// Find procedures that query a specific table
const procedures = await mcp_search_in_definitions({ 
  pattern: "FROM Users",
  object_types: ["P"]
});

// Get all tables in the database
const tables = await mcp_search_objects_by_type({ 
  object_type: "TABLE" 
});
```

### Analyzing Table Structure
```typescript
// Complete table analysis
const analysis = await mcp_get_all_table_info({ 
  table_name: "[dbo].[Users]" 
});

// Quick data overview
const overview = await mcp_quick_data_analysis({ 
  table_name: "[dbo].[Users]",
  limit: 50
});
```

### Stored Procedure Analysis
```typescript
// Complete SP analysis
const spAnalysis = await mcp_get_sp_complete_structure({ 
  sp_name: "[dbo].[usp_GetUserData]" 
});

// Simple SP info (Python style)
const spInfo = await mcp_get_sp_all_info_simple({ 
  sp_name: "[dbo].[usp_GetUserData]" 
});
```

## 🧪 **Testing**

Run the comprehensive test suite:
```bash
npm test
```

The test suite includes:
- ✅ **26 passing tests** covering all functionality
- 🎨 **Beautiful formatted output** with tables, colors, and emojis
- 📊 **Real database testing** with actual SQL Server data
- 🔍 **ObjectSearch testing** for all search functions
- 🎨 **QuickView testing** for enhanced data analysis
- 📋 **Complete coverage** of Python equivalents

## 🏗️ **Architecture**

### File Structure
```
MCPQL/
├── src/
│   ├── __tests__/          # Comprehensive test suite
│   ├── db.ts              # Database connection management
│   ├── mcp-server.ts      # All MCP tool implementations
│   ├── server.ts          # MCP server setup and handlers
│   ├── tools.ts           # Tool definitions and schemas
│   └── utils.ts           # Utility functions
├── dist/                  # Compiled JavaScript output
└── package.json          # Dependencies and scripts
```

### Key Components
- **MCP Server**: Handles tool registration and execution
- **Database Layer**: SQL Server connection and query execution
- **Tool Handlers**: Individual function implementations
- **Type Safety**: Full TypeScript support with proper error handling

## 🔧 **Development**

### Building
```bash
npm run build
```

### Cleaning
```bash
npm run clean
```

### Development Scripts
```bash
npm run dev     # Development mode
npm run test    # Run tests
npm run lint    # Code linting
```

## 🎯 **Python Compatibility**

This implementation provides **complete feature parity** with Python versions:

### ✅ **TableInfo Class** - Complete Implementation
- All individual functions (columns, primary keys, foreign keys, indexes, constraints)
- All-in-one analysis function
- Enhanced metadata and formatted output

### ✅ **StoredProcedureStructure Class** - Complete Implementation  
- Enhanced SP analysis with comprehensive info, parameters, and dependencies
- Complete structure analysis using all individual functions
- Parallel query execution for optimal performance

### ✅ **StoredProcedureInfo Class** - Complete Implementation
- Simple SP analysis functions
- Matches Python's `get_all_info` method exactly
- Basic parameter and dependency information

### ✅ **QuickView Class** - Complete Implementation
- Enhanced data preview with formatting and binary data handling
- Sample values extraction
- Comprehensive column statistics with sample data
- Quick data analysis combining multiple metrics

### ✅ **ObjectSearch Class** - Complete Implementation (VERY IMPORTANT)
- Search by name patterns with type filtering
- Search within object definitions/source code
- Search by object type
- Comprehensive dependency analysis
- Combined search functionality

## 🚀 **Performance Features**

- ⚡ **Parallel Query Execution**: Multiple queries run simultaneously for optimal speed
- 🛡️ **Robust Error Handling**: Comprehensive error handling and validation
- 📋 **Rich Metadata**: Detailed results with comprehensive database information
- 🔧 **Flexible Options**: Both individual functions and all-in-one analysis
- 📊 **Formatted Output**: Beautiful tables, colors, and emojis in test results

## 📝 **Notes**

- **Object Names**: Always use bracketed, schema-qualified names like `[schema].[object]`
- **Error Handling**: All functions return `{success: boolean, data?: any, error?: string}`
- **Type Safety**: Full TypeScript support with proper type definitions
- **Testing**: Comprehensive test suite with 26 tests covering all functionality
- **Compatibility**: Complete Python feature parity for all classes

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🎯 Key Highlight**: This implementation provides **complete Python equivalence** for SQL Server database analysis, with enhanced search capabilities through the **ObjectSearch class** (very important for database object discovery) and improved data analysis through the **QuickView class**. All 26 tests pass with beautiful formatted output! 🚀
