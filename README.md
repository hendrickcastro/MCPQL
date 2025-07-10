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

### Installation & Configuration

#### Option 1: Using npx from GitHub (Recommended)
No installation needed! Just configure your MCP client:

**For Claude Desktop (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "mcpql": {
      "command": "npx",
      "args": ["-y", "hendrickcastro/mcpql"],
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
      "args": ["-y", "hendrickcastro/mcpql"],
      "env": {
        "DB_SERVER": "your_server",
        "DB_NAME": "your_database",
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_PORT": "1433",
        "DB_TRUST_SERVER_CERTIFICATE": "yes",
        "DB_ENCRYPT": "true"
      }
    }
  }
}
```

#### Option 2: Local Development Installation

1. **Clone and setup:**
```bash
git clone https://github.com/hendrickcastro/MCPQL.git
cd MCPQL
npm install
npm run build
```

2. **Configure database connection:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Configure MCP client with local path:**
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

MCPQL provides 10 comprehensive tools for SQL Server database operations:

### 1. 🏗️ **Table Analysis** - `mcp_table_analysis`
Complete table structure analysis including columns, keys, indexes, and constraints.

### 2. 📋 **Stored Procedure Analysis** - `mcp_sp_structure`
Analyze stored procedure structure including parameters, dependencies, and source code.

### 3. 👀 **Data Preview** - `mcp_preview_data`
Preview table data with optional filtering and row limits.

### 4. 📊 **Column Statistics** - `mcp_get_column_stats`
Get comprehensive statistics for a specific column.

### 5. ⚙️ **Execute Stored Procedure** - `mcp_execute_procedure`
Execute stored procedures with parameters and return results.

### 6. 🔍 **Execute SQL Query** - `mcp_execute_query`
Execute custom SQL queries with full error handling.

### 7. ⚡ **Quick Data Analysis** - `mcp_quick_data_analysis`
Quick statistical analysis including row count, column distributions, and top values.

### 8. 🔎 **Comprehensive Search** - `mcp_search_comprehensive`
Search across database objects by name and definition with configurable criteria.

### 9. 🔗 **Object Dependencies** - `mcp_get_dependencies`
Get dependencies for database objects (tables, views, stored procedures, etc.).

### 10. 🎯 **Sample Values** - `mcp_get_sample_values`
Get sample values from a specific column in a table.

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

## 🔧 Environment Variables

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

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

The test suite includes comprehensive testing of all 10 tools with real database testing and complete coverage.

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
└── package.json           # Dependencies and scripts
```

### Key Features
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
3. Make your changes and add tests
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Uses [mssql](https://github.com/tediousjs/node-mssql) for SQL Server connectivity
- Comprehensive testing with [Jest](https://jestjs.io/)

---

**🎯 MCPQL provides comprehensive SQL Server database analysis and manipulation capabilities through the Model Context Protocol. Perfect for database administrators, developers, and anyone working with SQL Server databases!** 🚀
