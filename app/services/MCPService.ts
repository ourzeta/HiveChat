import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport, SSEClientTransportOptions } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport, StreamableHTTPClientTransportOptions } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { MCPServer, MCPTool } from '@/types/llm';

class MCPService {
  private clients: Map<string, Client> = new Map()
  private initialized = false

  constructor() {
    if (this.initialized) return;
    this.initialized = true
  }

  public async initClient(server: MCPServer): Promise<Client> {
    const existingClient = this.clients.get(server.name);
    if (existingClient) {
      try {
        // Check if the existing client is still connected
        const pingResult = await existingClient.ping()
        console.info(`[MCP] Ping result for ${server.name}:`, pingResult)
        if (!pingResult) {
          this.clients.delete(server.name)
        } else {
          return existingClient
        }
      } catch (error) {
        console.error(`[MCP] Error pinging server ${server.name}:`, error)
        this.clients.delete(server.name);
      }
    }

    const client = new Client({ name: 'Hivechat', version: '0.1.0' }, { capabilities: {} })
    let transport: SSEClientTransport | StreamableHTTPClientTransport;
    try {
      if (server.type === 'streamableHttp') {
        const options: StreamableHTTPClientTransportOptions = {}
        transport = new StreamableHTTPClientTransport(new URL(server.baseUrl!), options)
      } else {
        const options: SSEClientTransportOptions = {
          requestInit: {}
        }
        transport = new SSEClientTransport(new URL(server.baseUrl!), options)
      }
      await client.connect(transport);
      this.clients.set(server.name, client)

      console.info(`[MCP] Activated server: ${server.name}`)
      return client;
    } catch (error: any) {
      console.error(`[MCP] Error activating server ${server.name}:`, error)
      throw new Error(`[MCP] Error activating server ${server.name}: ${error.message}`)
    }
  }

  async closeClient(serverName: string) {
    const client = this.clients.get(serverName)
    if (client) {
      await client.close()
      console.info(`[MCP] Closed server: ${serverName}`)
      this.clients.delete(serverName)
      console.info(`[MCP] Cleared cache for server: ${serverName}`)
    } else {
      console.warn(`[MCP] No client found for server: ${serverName}`)
    }
  }

  async stopServer(server: MCPServer) {
    console.info(`[MCP] Stopping server: ${server.name}`)
    await this.closeClient(server.name)
  }

  async removeServer(server: MCPServer) {
    const existingClient = this.clients.get(server.name)
    if (existingClient) {
      await this.closeClient(server.name)
    }
  }

  async restartServer(server: MCPServer) {
    console.info(`[MCP] Restarting server: ${server.name}`)
    await this.closeClient(server.name)
    await this.initClient(server)
  }

  public deactivate(serverName: string) {
    this.closeClient(serverName)
  }

  public deleteServer(serverName: string) {
    this.closeClient(serverName)
  }

  async listTools(server: MCPServer): Promise<MCPTool[]> {
    console.info(`[MCP] Listing tools for server: ${server.name}`)
    const client = await this.initClient(server)
    try {
      // Create a timeout promise that rejects after 20 seconds
      const timeoutPromise = new Promise<{tools: any[]}>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout: Listing tools on '${server.name}' exceeded 20 seconds`));
        }, 20000);
      });

      // Race the actual tool listing against the timeout
      const { tools } = await Promise.race([
        client.listTools(),
        timeoutPromise
      ]);
      
      const serverTools: MCPTool[] = []
      tools.map((tool: any) => {
        const serverTool: MCPTool = {
          ...tool,
          id: tool.name,
          serverName: server.name
        }
        serverTools.push(serverTool)
      })
      return serverTools
    } catch (error) {
      console.error(`[MCP] Failed to list tools for server: ${server.name}`, error)
      return []
    }
  }
  /**
   * Call a tool on an MCP server
   */
  public async callTool({ server, name, args }: { server: MCPServer; name: string; args: any }): Promise<any> {
    try {
      console.info('[MCP] Calling:', server.name, name, args)
      const client = await this.initClient(server)
      
      // Create a timeout promise that rejects after 20 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout: Tool call '${name}' on '${server.name}' exceeded 20 seconds`));
        }, 20000);
      });

      // Race the actual tool call against the timeout
      const result = await Promise.race([
        client.callTool({ name, arguments: args }),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error(`[MCP] Error calling tool ${name} on ${server.name}:`, error)
      throw error
    }
  }
}
const mcpServiceInstance = new MCPService();
export default mcpServiceInstance;