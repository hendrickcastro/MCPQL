#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { connectDB } from './db.js';
import { MCP_MSQL_TOOLS } from './tools.js';
import * as toolHandlers from './mcp-server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Setup file logging
function logToFile(message, ...args) {
    const logFile = path.join(__dirname, '..', 'mcp_debug.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}\n`;
    try {
        fs.appendFileSync(logFile, logMessage);
        console.error(message, ...args); // Also log to console
    }
    catch (err) {
        console.error('Error writing to log file:', err);
    }
}
// Function to safely prepare data for MCP response (minimal processing)
function prepareDataForResponse(data) {
    try {
        let serialized = JSON.stringify(data, (key, value) => {
            // Only handle truly problematic values, preserve SQL content
            if (value === undefined)
                return null;
            if (typeof value === 'function')
                return '[Function]';
            if (value instanceof Date)
                return value.toISOString();
            return value; // Keep everything else as-is, including long strings and special chars
        }, 2);
        logToFile(`[DEBUG] Response serialized successfully, length: ${serialized.length}`);
        return serialized;
    }
    catch (error) {
        logToFile(`[DEBUG] Data preparation error: ${error.message}`);
        return `[Data Preparation Error: ${error.message}]`;
    }
}
// Create the server with name and version
// @ts-ignore - Bypass TypeScript errors from the SDK's types
const server = new Server({
    name: "msql-proxy-server",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {}
    }
});
// Register the ListTools handler
// @ts-ignore - Bypass TypeScript errors from the SDK's types
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MCP_MSQL_TOOLS
}));
// Register the CallTool handler
// @ts-ignore - Bypass TypeScript errors from the SDK's types
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const input = request.params.arguments;
    const handler = toolHandlers[toolName];
    if (!handler) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: Tool '${toolName}' not found.`
                }
            ],
            isError: true
        };
    }
    try {
        await connectDB();
        let result;
        switch (toolName) {
            case 'mcp_get_sp_all_info_simple':
                result = await toolHandlers.mcp_get_sp_all_info_simple(input);
                break;
            case 'mcp_preview_data_enhanced':
                result = await toolHandlers.mcp_preview_data_enhanced(input);
                break;
            case 'mcp_get_sample_values':
                result = await toolHandlers.mcp_get_sample_values(input);
                break;
            case 'mcp_get_column_stats_enhanced':
                result = await toolHandlers.mcp_get_column_stats_enhanced(input);
                break;
            case 'mcp_quick_data_analysis':
                result = await toolHandlers.mcp_quick_data_analysis(input);
                break;
            case 'mcp_search_objects_by_name':
                result = await toolHandlers.mcp_search_objects_by_name(input);
                break;
            case 'mcp_search_in_definitions':
                result = await toolHandlers.mcp_search_in_definitions(input);
                break;
            case 'mcp_search_objects_by_type':
                result = await toolHandlers.mcp_search_objects_by_type(input);
                break;
            case 'mcp_get_object_dependencies':
                result = await toolHandlers.mcp_get_object_dependencies(input);
                break;
            case 'mcp_search_comprehensive':
                result = await toolHandlers.mcp_search_comprehensive(input);
                break;
            default:
                result = await handler(input);
        }
        logToFile(`[DEBUG] Tool: ${toolName}, Success: ${result.success}`);
        // Check if the handler result indicates an error
        if (!result.success) {
            logToFile(`[DEBUG] Handler error: ${result.error}`);
            const errorResponse = {
                content: [
                    {
                        type: "text",
                        text: `Error: ${result.error}`
                    }
                ],
                isError: true
            };
            logToFile(`[DEBUG] About to return error response for tool: ${toolName}`);
            return errorResponse;
        }
        // Safely prepare the data for response
        const serializedData = prepareDataForResponse(result.data);
        logToFile(`[DEBUG] Returning data length: ${serializedData.length}`);
        // Return successful result data only
        const response = {
            content: [
                {
                    type: "text",
                    text: serializedData
                }
            ]
        };
        logToFile(`[DEBUG] About to return successful response for tool: ${toolName}`);
        // Log after response is sent
        setImmediate(() => {
            logToFile(`[DEBUG] Response sent successfully for tool: ${toolName}`);
        });
        return response;
    }
    catch (error) {
        logToFile(`[DEBUG] Catch block error: ${error.message}`);
        logToFile(`[DEBUG] Error stack: ${error.stack}`);
        const catchErrorResponse = {
            content: [
                {
                    type: "text",
                    text: `Error executing tool '${toolName}': ${error.message}`
                }
            ],
            isError: true
        };
        logToFile(`[DEBUG] About to return catch error response for tool: ${toolName}`);
        return catchErrorResponse;
    }
    // Don't close the connection after each call to allow multiple tool calls in the same session
    // The connection will be managed by the MCP's own lifecycle
});
// Start the server using stdio transport
// This is exactly how the working example does it
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logToFile("=== SQL Server MCP Proxy STARTED ===");
    console.error("SQL Server MCP Proxy running on stdio");
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
