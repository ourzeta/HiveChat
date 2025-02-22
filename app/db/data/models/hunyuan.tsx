import { LLMModel } from "@/app/adapter/interface"
export const provider = {
  id: 'hunyuan',
  providerName: '腾讯混元',
}

export const modelList: LLMModel[] = [
  {
    'id': 'hunyuan-turbo-latest',
    'displayName': 'Hunyuan Turbo',
    'supportVision': false,
    "maxTokens": 32768,
    'selected': true,
    provider
  },
  {
    'id': 'hunyuan-large',
    'displayName': 'Hunyuan Large',
    'supportVision': false,
    "maxTokens": 32768,
    'selected': true,
    provider
  },
  {
    'id': 'hunyuan-standard-vision',
    'displayName': 'Hunyuan Standard Vision',
    'supportVision': true,
    "maxTokens": 8192,
    'selected': true,
    provider
  },
  {
    'id': 'hunyuan-lite-vision',
    'displayName': 'Hunyuan Lite Vision',
    'supportVision': true,
    "maxTokens": 32768,
    'selected': true,
    provider
  },
]