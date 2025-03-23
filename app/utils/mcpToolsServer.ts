'use server';
import { MCPTool } from '@/app/adapter/interface';
import mcpService from '@/app/service/MCPService';

export async function getToolList(serverNames: string[]): Promise<MCPTool[]> {
  if (serverNames.length > 0) {
    const tools = await mcpService.listTools(serverNames);
    return tools;
  } else {
    return [];
  }
}

export async function callMCPTool(tool: MCPTool): Promise<any> {
  const toolInfo = {
    client: tool.serverName,
    name: tool.name,
    args: tool.inputSchema,
  }
  try {
    const resp = await mcpService.callTool(toolInfo)
    // console.log(`[MCP] Tool called: ${tool.serverName} ${tool.name}`, resp)
    return resp
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
