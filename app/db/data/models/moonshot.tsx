import { LLMModel, LLMModelProvider } from "@/types/llm"
export const provider: LLMModelProvider = {
  id: 'moonshot',
  providerName: 'Moonshot',
  apiStyle: 'openai',
}

export const modelList: LLMModel[] = [
  {
    'id': 'kimi-k2-0711-preview',
    'displayName': 'Kimi K2',
    'supportVision': true,
    'supportTool': true,
    "maxTokens": 131072,
    'selected': true,
    provider
  },
  {
    'id': 'moonshot-v1-auto',
    'displayName': 'Moonshot v1 Auto',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 131072,
    'selected': true,
    provider
  }
]