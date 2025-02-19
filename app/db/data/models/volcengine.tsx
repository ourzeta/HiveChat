import { LLMModel } from "@/app/adapter/interface"
export const provider = {
  id: 'volcengine',
  providerName: '火山方舟（豆包）',
}

export const modelList: LLMModel[] = [
  {
    'id': 'ep-20241217175331-vhz62',
    'displayName': 'Doubao Vision Pro 32k',
    'maxTokens': 32768,
    'supportVision': true,
    'selected': true,
    provider
  },
  {
    'id': 'ep-20240721022040-sm4bq',
    'displayName': 'Doubao Pro',
    'maxTokens': 32768,
    'supportVision': false,
    'selected': true,
    provider
  },
  {
    'id': 'ep-20241206150637-pwlkf',
    'displayName': 'Doubao Lite 32K',
    'maxTokens': 32768,
    'supportVision': false,
    'selected': true,
    provider
  },
]