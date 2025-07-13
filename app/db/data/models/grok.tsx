import { LLMModel, LLMModelProvider } from "@/types/llm"
export const provider: LLMModelProvider = {
  id: 'grok',
  providerName: 'Grok',
  apiStyle: 'openai',
}

export const modelList: LLMModel[] = [
  {
    'id': 'grok-4-latest',
    'displayName': 'Grok4',
    'supportVision': true,
    'supportTool': true,
    "maxTokens": 262144,
    'selected': true,
    provider
  },
  {
    'id': 'grok-3',
    'displayName': 'Grok3',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 131072,
    'selected': true,
    provider
  },
  {
    'id': 'grok-3-mini',
    'displayName': 'Grok3 Mini',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 131072,
    'selected': true,
    provider
  },
]