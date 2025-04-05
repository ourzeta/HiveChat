import { LLMModel } from "@/types/llm"
export const provider = {
  id: 'grok',
  providerName: 'Grok',
}

export const modelList: LLMModel[] = [
  {
    'id': 'grok-2',
    'displayName': 'Grok2',
    'supportVision': false,
    "maxTokens": 131072,
    'selected': true,
    provider
  },
  {
    'id': 'grok-2-vision-1212',
    'displayName': 'Grok2 Vision',
    'supportVision': true,
    "maxTokens": 32768,
    'selected': true,
    provider
  },
  {
    'id': 'grok-beta',
    'displayName': 'Grok Beta',
    'supportVision': false,
    "maxTokens": 131072,
    'selected': true,
    provider
  },

  {
    'id': 'grok-vision-beta',
    'displayName': 'Grok Vision Beta',
    'supportVision': true,
    "maxTokens": 8192,
    'selected': true,
    provider
  },
]