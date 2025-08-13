/**
 * Normalizes a SQL object name (table, view, sp) by wrapping its parts in square brackets.
 * Handles names with or without schema.
 * e.g., 'dbo.Users' -> '[dbo].[Users]'
 * e.g., 'Users' -> '[dbo].[Users]'
 * e.g., 'sec.[User]' -> 'sec.[User]' (already bracketed)
 * @param name The object name string.
 * @returns A normalized string safe for SQL queries.
 */
export const normalizeSqlObjectName = (name) => {
    if (!name)
        return '';
    // If the name seems to be already (partially or fully) bracketed, trust it.
    if (name.includes('[') && name.includes(']')) {
        return name;
    }
    const parts = name.split('.');
    if (parts.length === 1) {
        return `[dbo].[${parts[0]}]`;
    }
    const [schema, objectName] = parts;
    return `[${schema}].[${objectName}]`;
};
