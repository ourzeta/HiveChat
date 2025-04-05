import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { MCPServer, MCPTool } from '@/types/llm';
import { mcpServers } from '@/app/db/schema';
import { db } from '@/app/db';
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid';

class MCPService {
  private servers: MCPServer[] = []
  private activeServers: Map<string, any> = new Map()
  private clients: { [key: string]: any } = {}
  private Client: typeof Client | undefined
  private sseTransport: typeof SSEClientTransport | undefined
  private initialized = false

  constructor() {
    if (this.initialized) return;
    this.Client = Client;
    this.sseTransport = SSEClientTransport;
    this.initialized = true
  }

  /**
   * Add a new MCP server
   */
  public async addServer(server: MCPServer): Promise<void> {
    // Check for duplicate name
    if (this.servers.some((s) => s.name === server.name)) {
      console.log(`Server with name ${server.name} already exists`);
      return;
    }

    // Activate if needed
    if (server.isActive) {
      await this.activate(server)
    }

    // Add to servers list
    this.servers = [...this.servers, server]
  }

  public async activate(server: MCPServer): Promise<void> {

    const { name, baseUrl } = server
    // Skip if already running
    if (this.clients[name]) {
      console.log(`[MCP] Server ${name} is already running`)
      return
    }

    let transport: SSEClientTransport

    try {
      // Create appropriate transport based on configuration
      transport = new this.sseTransport!(new URL(baseUrl!))
      // Create and connect client
      const client = new this.Client!({ name, version: '1.0.0' }, { capabilities: {} })

      // 设置连接超时时间为30秒
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 20000);
      });

      await Promise.race([
        client.connect(transport),
        timeoutPromise
      ]);

      // Store client and server info
      this.clients[name] = client
      this.activeServers.set(name, { client, server })
    } catch (error) {
      console.log(`[MCP] Error activating server ${name}:`, error)
      this.deactivate(name)
      throw error
    }
  }

  public async deactivate(name: string): Promise<void> {
    if (!this.clients[name]) {
      console.log(`[MCP] Server ${name} is not running`)
      return
    }

    try {
      console.log(`[MCP] Stopping server: ${name}`)
      await this.clients[name].close()
      delete this.clients[name]
      this.activeServers.delete(name)
    } catch (error) {
      console.log(`[MCP] Error deactivating server ${name}:`, error)
      throw error
    }
  }

  /**
   * Delete an MCP server
   */
  public async deleteServer(serverName: string): Promise<void> {

    // Deactivate if running
    if (this.clients[serverName]) {
      await this.deactivate(serverName)
    }

    // Update servers list
    const filteredServers = this.servers.filter((s) => s.name !== serverName)
    this.servers = filteredServers;
  }

  public async listTools(serverNames: string[]): Promise<MCPTool[]> {
    try {

      // Otherwise list tools from all active servers
      let allTools: MCPTool[] = []

      for (const serverName of serverNames) {
        try {
          const tools = await this.listToolsFromServer(serverName)
          allTools = allTools.concat(tools)
        } catch (error) {
          console.error(`Error listing tools for ${serverName}`, error)
        }
      }

      console.log(`[MCP] Total tools listed: ${allTools.length}`)
      return allTools
    } catch (error) {
      console.error('Error listing tools:', error)
      return []
    }
  }

  /**
   * Helper method to list tools from a specific server
  */
  private async listToolsFromServer(serverName: string): Promise<MCPTool[]> {
    if (!this.clients[serverName]) {
      throw new Error(`MCP Client ${serverName} not found`)
    }
    const { tools } = await this.clients[serverName].listTools()

    return tools.map((tool: any) => ({
      ...tool,
      serverName,
      id: 'f' + uuidv4().replace(/-/g, '')
    }))
  }

  /**
   * Call a tool on an MCP server
   */
  public async callTool(params: { client: string; name: string; args: any }): Promise<any> {
    const { client, name, args } = params
    if (!this.clients[client]) {
      // 需要自动重新连接
      console.log(`Restart Server ${client}, call function ${name}`)
      const server = await db.query.mcpServers.findFirst({
        where: eq(mcpServers.name, client),
      });
      if (server) {
        await this.addServer({
          ...server,
          isActive: true,
          description: server.description || undefined,
        })
      } else {
        throw new Error(`MCP Client ${client} not found`)
      }
    }
    console.info('[MCP] Calling:', client, name, args)
    try {
      return await this.clients[client].callTool({
        name,
        arguments: args
      })
    } catch (error) {
      console.error(`[MCP] Error calling tool ${name} on ${client}:`, error)
      throw error
    }
  }
}

const mcpServiceInstance = new MCPService();
export default mcpServiceInstance;