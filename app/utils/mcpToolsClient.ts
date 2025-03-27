'use client';
import { MCPTool } from '@/app/adapter/interface';
import { Tool, ToolUnion, ToolUseBlock } from '@anthropic-ai/sdk/resources'
import { ChatCompletionTool, ChatCompletionMessageToolCall } from 'openai/resources';

const supportedAttributes = [
  'type',
  'nullable',
  'required',
  'description',
  'properties',
  'items',
  'enum',
  'anyOf'
]

function filterPropertieAttributes(tool: MCPTool) {
  const roperties = tool.inputSchema.properties
  const getSubMap = (obj: Record<string, any>, keys: string[]) => {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)))
  }
  for (const [key, val] of Object.entries(roperties)) {
    roperties[key] = getSubMap(val, supportedAttributes)
  }
  return roperties
}

export function mcpToolsToOpenAITools(mcpTools: MCPTool[]): ChatCompletionTool[] {
  return mcpTools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: filterPropertieAttributes(tool)
      }
    }
  }))
}

export function mcpToolsToAnthropicTools(mcpTools: MCPTool[]): Array<ToolUnion> {
  return mcpTools.map((tool) => {
    const t: Tool = {
      name: tool.id,
      description: tool.description,
      // @ts-ignore no check
      input_schema: { ...(tool.inputSchema), type: 'object' }
    }
    return t
  })
}

export function anthropicToolUseToMcpTool(mcpTools: MCPTool[] | undefined, toolUse: ToolUseBlock): MCPTool | undefined {
  if (!mcpTools) return undefined
  const tool = mcpTools.find((tool) => tool.id === toolUse.name)
  if (!tool) {
    return undefined
  }
  // @ts-ignore ignore type as it it unknow
  tool.inputSchema = toolUse.input
  // use this to parse the arguments and avoid parsing errors
  try {
    tool.inputSchema = JSON.parse(toolUse.input as string)
  } catch (e) {
    console.error('Error parsing arguments', e)
  }
  return tool
}

export function openAIToolsToMcpTool(
  mcpTools: MCPTool[] | undefined,
  llmTool: ChatCompletionMessageToolCall
): MCPTool | undefined {
  if (!mcpTools) return undefined
  const tool = mcpTools.find((tool) => tool.name === llmTool.function.name)
  if (!tool) {
    return undefined
  }
  console.log(
    `[MCP] OpenAI Tool to MCP Tool: ${tool.serverName} ${tool.name}`,
    tool,
    'args',
    llmTool.function.arguments
  )
  // use this to parse the arguments and avoid parsing errors
  let args: any = {}
  try {
    args = JSON.parse(llmTool.function.arguments)
  } catch (e) {
    console.error('Error parsing arguments', e)
  }

  return {
    id: tool.id,
    serverName: tool.serverName,
    name: tool.name,
    description: tool.description,
    inputSchema: args
  }
}