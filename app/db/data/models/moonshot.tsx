import { LLMModel } from "@/app/adapter/interface"
export const provider = {
  id: 'moonshot',
  providerName: 'Moonshot',
}

export const modelList: LLMModel[] = [
  {
    'id': 'moonshot-v1-auto',
    'displayName': 'Moonshot v1 Auto',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 131072,
    'selected': true,
    provider
  },
  {
    'id': 'moonshot-v1-8k',
    'displayName': 'Moonshot v1 8K',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 8192,
    'selected': true,
    provider
  },
  {
    'id': 'moonshot-v1-32k',
    'displayName': 'Moonshot v1 32K',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 32768,
    'selected': true,
    provider
  },
  {
    'id': 'moonshot-v1-128k',
    'displayName': 'Moonshot v1 128K',
    'supportVision': false,
    'supportTool': true,
    "maxTokens": 131072,
    'selected': true,
    provider
  },
]