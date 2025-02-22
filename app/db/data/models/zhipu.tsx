import { LLMModel } from "@/app/adapter/interface"
export const provider = {
  id: 'zhipu',
  providerName: '智谱',
}

export const modelList: LLMModel[] = [
  {
    'id': 'GLM-Zero-Preview',
    'displayName': 'GLM Zero',
    'supportVision': false,
    "maxTokens": 16384,
    'selected': true,
    provider
  },
  {
    'id': 'GLM-4-Plus',
    'displayName': 'GLM4 Plus',
    'supportVision': false,
    "maxTokens": 131072,
    'selected': true,
    provider
  },
  {
    'id': 'GLM-4-Air',
    'displayName': 'GLM4 Air',
    'supportVision': false,
    "maxTokens": 131072,
    'selected': true,
    provider
  },
  {
    'id': 'GLM-4V-Plus',
    'displayName': 'GLM 4V Plus',
    'supportVision': true,
    "maxTokens": 16384,
    'selected': true,
    provider
  },
  {
    'id': 'GLM-4V',
    'displayName': 'GLM 4V',
    'supportVision': false,
    "maxTokens": 4096,
    'selected': true,
    provider
  },
  {
    'id': 'GLM-4V-Flash',
    'displayName': 'GLM 4V Flash',
    'supportVision': true,
    "maxTokens": 4096,
    'selected': true,
    provider
  },
]