# MCPQL - SQL Server MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)

A comprehensive **Model Context Protocol (MCP)** server for **SQL Server** database operations. This server provides 10 powerful tools for database analysis, object discovery, and data manipulation through the MCP protocol.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- SQL Server database with appropriate connection credentials
- MCP-compatible client (like Claude Desktop, Cursor IDE, or any MCP client)

### Installation Options

#### Option 1: Using npx from GitHub (Recommended)
No installation needed! Just configure your MCP client to use `npx -y hendrickcastro/mcpql` directly.

#### Option 2: Local Development Installation

1. **Clone the repository:**
```bash
git clone https://github.com/hendrickcastro/MCPQL.git
cd MCPQL
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure database connection:**
Copy the example environment file and configure your database:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

Or set environment variables directly:
```bash
export DB_USER="your_username"
export DB_PASSWORD="your_password"
export DB_SERVER="your_server"
export DB_NAME="your_database"
export DB_PORT="1433"
export DB_ENCRYPT="true"
export DB_TRUST_SERVER_CERTIFICATE="false"
export DB_TIMEOUT="30000"
```

4. **Build the project:**
```bash
npm run build
```

5. **Configure your MCP client:**
Add to your MCP client configuration:

**For Claude Desktop (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "mcpql": {
      "command": "npx",
      "args": [
        "-y",
        "hendrickcastro/mcpql"
      ],
      "env": {
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_SERVER": "your_server",
        "DB_NAME": "your_database",
        "DB_PORT": "1433",
        "DB_ENCRYPT": "true",
        "DB_TRUST_SERVER_CERTIFICATE": "false"
      }
    }
  }
}
```

**For Cursor IDE:**
```json
{
  "mcpServers": {
    "mcpql": {
      "command": "npx",
      "args": [
        "-y",
        "hendrickcastro/mcpql"
      ],
      "env": {
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_SERVER": "your_server",
        "DB_NAME": "your_database"
      }
    }
  }
}
```

**Alternative: Using local installation**
If you prefer to use a local installation instead of npx:
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

## 🔧 Using with npx from GitHub

The easiest way to use MCPQL is with npx directly from GitHub. No installation required!

### Configuration for npx usage:

**For Claude Desktop:**
```json
{
  "mcpServers": {
    "mcpql": {
      "command": "npx",
      "args": [
        "-y",
        "hendrickcastro/mcpql"
      ],
      "env": {
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_SERVER": "your_server",
        "DB_NAME": "your_database"
      }
    }
  }
}
```

**For Cursor IDE:**
```json
{
  "mcpServers": {
    "mcpql": {
      "command": "npx",
      "args": [
        "-y",
        "hendrickcastro/mcpql"
      ],
      "env": {
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_SERVER": "your_server",
        "DB_NAME": "your_database"
      }
    }
  }
}
```

## 🛠️ Available Tools

MCPQL provides 10 comprehensive tools for SQL Server database operations:

### 1. 🏗️ **Table Analysis** - `mcp_table_analysis`
Complete table structure analysis including columns, keys, indexes, and constraints.
```typescript
// Example usage in MCP client
mcp_table_analysis({
  table_name: "dbo.Users"
})
```

### 2. 📋 **Stored Procedure Analysis** - `mcp_sp_structure`
Analyze stored procedure structure including parameters, dependencies, and source code.
```typescript
mcp_sp_structure({
  sp_name: "dbo.usp_GetUserData"
})
```

### 3. 👀 **Data Preview** - `mcp_preview_data`
Preview table data with optional filtering and row limits.
```typescript
mcp_preview_data({
  table_name: "dbo.Users",
  filters: { "Status": "Active" },
  limit: 50
})
```

### 4. 📊 **Column Statistics** - `mcp_get_column_stats`
Get comprehensive statistics for a specific column.
```typescript
mcp_get_column_stats({
  table_name: "dbo.Users",
  column_name: "Age"
})
```

### 5. ⚙️ **Execute Stored Procedure** - `mcp_execute_procedure`
Execute stored procedures with parameters and return results.
```typescript
mcp_execute_procedure({
  sp_name: "dbo.usp_GetUserById",
  params: { "UserId": 123 }
})
```

### 6. 🔍 **Execute SQL Query** - `mcp_execute_query`
Execute custom SQL queries with full error handling.
```typescript
mcp_execute_query({
  query: "SELECT TOP 10 * FROM [dbo].[Users] WHERE [Status] = 'Active'"
})
```

### 7. ⚡ **Quick Data Analysis** - `mcp_quick_data_analysis`
Quick statistical analysis including row count, column distributions, and top values.
```typescript
mcp_quick_data_analysis({
  table_name: "dbo.Users",
  sample_size: 1000
})
```

### 8. 🔎 **Comprehensive Search** - `mcp_search_comprehensive`
Search across database objects by name and definition with configurable criteria.
```typescript
mcp_search_comprehensive({
  pattern: "User",
  object_types: ["TABLE", "VIEW", "PROCEDURE"],
  search_in_names: true,
  search_in_definitions: true
})
```

### 9. 🔗 **Object Dependencies** - `mcp_get_dependencies`
Get dependencies for database objects (tables, views, stored procedures, etc.).
```typescript
mcp_get_dependencies({
  object_name: "dbo.Users"
})
```

### 10. 🎯 **Sample Values** - `mcp_get_sample_values`
Get sample values from a specific column in a table.
```typescript
mcp_get_sample_values({
  table_name: "dbo.Users",
  column_name: "Department",
  limit: 10
})
```

## 🎯 Object Type Reference

When using search functions, you can filter by these object types:

- **TABLE** - Database tables
- **VIEW** - Database views
- **PROCEDURE** - Stored procedures
- **FUNCTION** - User-defined functions
- **TRIGGER** - Database triggers
- **DEFAULT** - Default constraints
- **CHECK** - Check constraints
- **RULE** - Rules

## 📋 Usage Examples

### Analyzing a Table
```typescript
// Get complete table structure
const analysis = await mcp_table_analysis({ 
  table_name: "dbo.Users" 
});

// Get quick data overview
const overview = await mcp_quick_data_analysis({ 
  table_name: "dbo.Users",
  sample_size: 500
});

// Preview table data with filters
const data = await mcp_preview_data({
  table_name: "dbo.Users",
  filters: { "Status": "Active", "Department": "IT" },
  limit: 25
});
```

### Finding Database Objects
```typescript
// Find all objects containing "User"
const objects = await mcp_search_comprehensive({ 
  pattern: "User",
  search_in_names: true,
  search_in_definitions: false
});

// Find procedures that query a specific table
const procedures = await mcp_search_comprehensive({ 
  pattern: "FROM Users",
  object_types: ["PROCEDURE"],
  search_in_definitions: true
});
```

### Analyzing Stored Procedures
```typescript
// Get complete stored procedure analysis
const spAnalysis = await mcp_sp_structure({ 
  sp_name: "dbo.usp_GetUserData" 
});

// Execute a stored procedure
const result = await mcp_execute_procedure({
  sp_name: "dbo.usp_GetUserById",
  params: { "UserId": 123, "IncludeDetails": true }
});
```

### Data Analysis
```typescript
// Get column statistics
const stats = await mcp_get_column_stats({
  table_name: "dbo.Users",
  column_name: "Age"
});

// Get sample values from a column
const samples = await mcp_get_sample_values({
  table_name: "dbo.Users",
  column_name: "Department",
  limit: 15
});
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

The test suite includes:
- ✅ **Comprehensive testing** of all 10 tools
- 🎨 **Beautiful formatted output** with tables and colors
- 📊 **Real database testing** with actual SQL Server data
- 🔍 **Complete coverage** of all functionality

## 🏗️ Architecture

### Project Structure
```
MCPQL/
├── src/
│   ├── __tests__/          # Comprehensive test suite
│   ├── tools/              # Modular tool implementations
│   │   ├── tableAnalysis.ts      # Table analysis tools
│   │   ├── storedProcedureAnalysis.ts  # SP analysis tools
│   │   ├── dataOperations.ts     # Data operation tools
│   │   ├── objectSearch.ts       # Search and discovery tools
│   │   ├── types.ts              # Type definitions
│   │   └── index.ts              # Tool exports
│   ├── db.ts               # Database connection management
│   ├── server.ts           # MCP server setup and handlers
│   ├── tools.ts            # Tool definitions and schemas
│   └── mcp-server.ts       # Tool re-exports
├── dist/                   # Compiled JavaScript output
├── doc/                    # Documentation
└── package.json           # Dependencies and scripts
```

### Key Components
- **MCP Server**: Handles tool registration and execution
- **Database Layer**: SQL Server connection and query execution with connection pooling
- **Tool Modules**: Modular implementations for different functionality areas
- **Type Safety**: Full TypeScript support with proper error handling

## 🔧 Development

### Development Commands
```bash
# Development mode
npm run start

# Build project
npm run build

# Clean build artifacts
npm run clean

# Run tests
npm test
```

### Environment Variables
All database connection parameters are configurable via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | Database username | Required |
| `DB_PASSWORD` | Database password | Required |
| `DB_SERVER` | SQL Server hostname/IP | Required |
| `DB_NAME` | Database name | Required |
| `DB_PORT` | SQL Server port | 1433 |
| `DB_ENCRYPT` | Enable encryption | false |
| `DB_TRUST_SERVER_CERTIFICATE` | Trust server certificate | false |
| `DB_TIMEOUT` | Connection timeout (ms) | 30000 |

## 🚀 Performance Features

- ⚡ **Connection Pooling**: Efficient database connection management
- 🛡️ **Robust Error Handling**: Comprehensive error handling and validation
- 📋 **Rich Metadata**: Detailed results with comprehensive database information
- 🔧 **Flexible Configuration**: Environment-based configuration
- 📊 **Optimized Queries**: Efficient SQL queries for all operations

## 📝 Important Notes

- **Object Names**: Always use schema-qualified names (e.g., `dbo.Users`, `api.Idiomas`)
- **Error Handling**: All tools return structured responses with success/error indicators
- **Type Safety**: Full TypeScript support with proper type definitions
- **Connection Management**: Automatic connection pooling and retry logic
- **Security**: Parameterized queries to prevent SQL injection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Uses [mssql](https://github.com/tediousjs/node-mssql) for SQL Server connectivity
- Comprehensive testing with [Jest](https://jestjs.io/)

---

**🎯 MCPQL provides comprehensive SQL Server database analysis and manipulation capabilities through the Model Context Protocol. Perfect for database administrators, developers, and anyone working with SQL Server databases!** 🚀
