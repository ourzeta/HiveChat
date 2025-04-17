'use server';
import { MCPTool, MCPServer } from '@/types/llm';
import mcpService from '@/app/services/MCPService';
import { mcpServers } from '@/app/db/schema';
import { db } from '@/app/db';
import { eq } from 'drizzle-orm';

export async function callMCPTool(tool: MCPTool): Promise<any> {
  const toolInfo = {
    name: tool.name,
    args: tool.inputSchema,
  }
  try {
    const server = await db.query.mcpServers.findFirst({
      where: eq(mcpServers.name, tool.serverName),
    });
    if (server) {
      const serverInfo: MCPServer = {
        name: server.name,
        description: server.description || undefined,
        type: server.type || 'sse',
        baseUrl: server.baseUrl,
        isActive: true,
      }
      const resp = await mcpService.callTool({ server: serverInfo, ...toolInfo })
      return resp;
    } else {
      throw new Error(`MCP Client ${tool.serverName} not found`)
    }

  } catch (e) {
    console.error(`[MCP] Error calling Tool: ${tool.serverName} ${tool.name}`, e)
    return Promise.resolve({
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error calling tool ${tool.name}: ${JSON.stringify(e)}`
        }
      ]
    })
  }
}
