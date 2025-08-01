# MCPQL Security Configuration

## Security Environment Variables

This project includes security mechanisms to prevent accidental database operations, especially important in production environments.

### Available Variables

#### `DB_ALLOW_MODIFICATIONS`
- **Default value**: `false`
- **Description**: Controls whether DML (INSERT, UPDATE, DELETE) and DDL (ALTER, DROP, CREATE) operations are allowed
- **Operations blocked when `false`**:
  - INSERT
  - UPDATE
  - DELETE
  - ALTER
  - DROP
  - CREATE
  - TRUNCATE
  - MERGE

#### `DB_ALLOW_STORED_PROCEDURES`
- **Default value**: `false`
- **Description**: Controls whether stored procedure execution is allowed
- **Affected tools**:
  - `mcp_execute_procedure`

## Configuration

### .env File
```env
# Allow database modifications
DB_ALLOW_MODIFICATIONS=true

# Allow stored procedure execution
DB_ALLOW_STORED_PROCEDURES=true
```

### System Variables (alternative)
```bash
# Windows
set DB_ALLOW_MODIFICATIONS=true
set DB_ALLOW_STORED_PROCEDURES=true

# Linux/Mac
export DB_ALLOW_MODIFICATIONS=true
export DB_ALLOW_STORED_PROCEDURES=true
```

## Check Security Status

Use the `mcp_get_security_status` tool to verify current configuration:

```json
{
  "name": "mcp_get_security_status",
  "arguments": {}
}
```

This tool returns:
- Current status of security variables
- Configuration recommendations
- Instructions to enable blocked operations

## Error Messages

### When modifications are disabled:
```
Error: Database modification operations are blocked for security.
To enable modifications, set: DB_ALLOW_MODIFICATIONS=true
CAUTION: Only enable in development environments or when absolutely necessary.
```

### When stored procedures are disabled:
```
Error: Stored procedure execution is blocked for security.
To enable stored procedures, set: DB_ALLOW_STORED_PROCEDURES=true
CAUTION: Only enable in development environments or when absolutely necessary.
```

## Best Practices

1. **Production**: Keep both variables set to `false` by default
2. **Development**: Enable according to specific needs
3. **Testing**: Use restrictive configuration for security testing
4. **Verification**: Use `mcp_get_security_status` regularly to confirm configuration

## Always Allowed Operations

The following operations are always permitted regardless of configuration:
- SELECT
- SHOW
- DESCRIBE
- EXPLAIN
- Schema analysis
- Statistics retrieval
- Metadata searches