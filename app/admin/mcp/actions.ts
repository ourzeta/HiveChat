'use server';
import { mcpServers, mcpTools } from '@/app/db/schema';
import { MCPTool } from '@/types/llm';
import mcpService from '@/app/service/MCPService';
import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { auth } from "@/auth";

export async function getMcpServerList() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const result = await db.query.mcpServers.findMany({
      orderBy: [mcpServers.createdAt],
    });
    return result;
  } catch (error) {
    throw new Error('query user list fail');
  }
}

export async function addMcpServer(mcpServerInfo: {
  name: string;
  isActive: boolean;
  description?: string;
  baseUrl: string;
}) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const existingServer = await db.query.mcpServers.findFirst({
      where: eq(mcpServers.name, mcpServerInfo.name),
    });

    if (existingServer) {
      return {
        success: false,
        message: `MCP Server ${mcpServerInfo.name} 已存在`,
      }
    }

    // 连接测试
    if (mcpServerInfo.isActive) {
      try {
        await mcpService.addServer(mcpServerInfo);
        try {
          const tools = await mcpService.listTools([mcpServerInfo.name]);
          await db.insert(mcpServers).values(mcpServerInfo);
          await db.insert(mcpTools).values(tools.map(tool => ({
            ...tool,
            inputSchema: JSON.stringify(tool.inputSchema),
          })));
        } catch (e) {
          return {
            success: false,
            message: `添加失败`
          }
        }
      } catch (error) {
        return {
          success: false,
          message: `添加失败：${(error as Error).message}`
        }
      }
    } else {
      await db.insert(mcpServers).values(mcpServerInfo);
    }
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: 'database add error'
    }
  }
}

export async function updateMcpServer(name: string, mcpServerInfo: {
  isActive?: boolean;
  description?: string | null;
  baseUrl?: string;
}) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const existingServer = await db.query.mcpServers.findFirst({
      where: eq(mcpServers.name, name),
    });

    if (!existingServer) {
      return {
        success: false,
        message: '此 MCP 服务器不存在'
      }
    } else {
      await db.update(mcpServers)
        .set(mcpServerInfo)
        .where(eq(mcpServers.name, name));
      if (mcpServerInfo.isActive) {
        try {
          await mcpService.activate({
            ...existingServer,
            description: existingServer.description || undefined,
          });
          // 删除原有的工具，再新增
          await db.delete(mcpTools).where(eq(mcpTools.serverName, name));
          // 新增新的工具
          const tools = await mcpService.listTools([name]);
          await db.insert(mcpTools).values(tools.map(tool => ({
            ...tool,
            inputSchema: JSON.stringify(tool.inputSchema),
          })));
        } catch (error) {
          return {
            success: false,
            message: 'connect MCP server error:' + (error as Error).message
          }
        }
      } else {
        mcpService.deactivate(existingServer.name);
      }
      return {
        success: true,
        message: '已更新',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'database update error' + (error as Error).message
    }
  }
}

export async function deleteMcpServer(name: string) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    await db.delete(mcpServers).where(eq(mcpServers.name, name));
    mcpService.deleteServer(name);
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: 'database delete error'
    }
  }
}

export async function fetchToolList(serverName: string): Promise<MCPTool[]> {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return [];
  }
  try {
    const result = await db.query.mcpTools.findMany({
      where: eq(mcpTools.serverName, serverName),
    });
    return result.map(item => ({
      id: item.name,
      name: item.name,
      description: item.description || undefined,
      serverName: item.serverName,
      inputSchema: JSON.parse(item.inputSchema)
    }));
  } catch (error) {
    return [];
  }
}
