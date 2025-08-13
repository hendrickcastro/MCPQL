#!/usr/bin/env node

/**
 * MCPQL Server - NPX Compatible Version
 * This version handles Azure MSAL dependency issues when running via npx
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MCP_MSQL_TOOLS } from './tools.js';
import * as toolHandlers from './tools/index.js';

// Enhanced error handling for Azure MSAL issues
process.on('uncaughtException', (error) => {
  if (error.message.includes('index-node-CtW_2rqJ.js') || 
      error.message.includes('@azure/msal-common')) {
    console.error('\n🚨 Azure MSAL Dependency Issue Detected!');
    console.error('This is a known issue when using npx with Azure packages.');
    console.error('\nSolutions:');
    console.error('1. Install globally: npm install -g mcpql');
    console.error('2. Use with --yes flag: npx --yes mcpql');
    console.error('3. Clear npx cache: npm cache clean --force');
    console.error('4. Run the fix script: ./_Guide/fix_npx_azure_msal_issue.ps1\n');
    process.exit(1);
  }
  throw error;
});

const server = new Server(
  {
    name: 'mcpql',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: MCP_MSQL_TOOLS.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolName = request.params.name;
    const args = request.params.arguments || {};
    
    // Get the tool handler function
    const handler = (toolHandlers as any)[toolName];
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    const result = await handler(args);
    return {
      content: [{
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    // Enhanced error handling for Azure MSAL issues
    if (error instanceof Error && 
        (error.message.includes('index-node-CtW_2rqJ.js') || 
         error.message.includes('@azure/msal-common'))) {
      return {
        content: [{
          type: 'text',
          text: `🚨 Azure MSAL Dependency Issue: ${error.message}\n\nThis is a known issue when using npx. Please run the fix script: ./_Guide/fix_npx_azure_msal_issue.ps1`
        }],
        isError: true,
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCPQL MCP Server running (NPX Compatible Version)');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});