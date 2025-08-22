import { LLMModel, LLMModelProvider } from "@/types/llm"
export const provider: LLMModelProvider = {
  id: 'openrouter',
  providerName: 'OpenRouter',
  apiStyle: 'openai',
}

export const modelList: LLMModel[] = [
  {
    'id': 'openai/gpt-5-chat',
    'displayName': 'GPT 5',
    'supportVision': true,
    'supportTool': true,
    "maxTokens": 400 * 1024,
    'selected': true,
    provider
  },
  {
    'id': 'openai/gpt-5-mini',
    'displayName': 'GPT 5 mini',
    'supportVision': true,
    'supportTool': true,
    "maxTokens": 400 * 1024,
    'selected': true,
    provider
  },
  {
    'id': 'deepseek/deepseek-r1:free',
    'displayName': 'DeepSeek: R1 (free)',
    'supportVision': false,
    "maxTokens": 164 * 1024,
    'selected': true,
    provider
  },
  {
    'id': 'deepseek/deepseek-chat:free',
    'displayName': 'DeepSeek V3 (free)',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 128 * 1024,
    'selected': true,
    provider
  },
  {
    'id': 'deepseek/deepseek-chat-v3.1',
    'displayName': 'DeepSeek V3.1',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 134144,
    'selected': true,
    provider
  },
]