import { LLMModel, LLMModelProvider } from "@/types/llm"
export const provider: LLMModelProvider = {
  id: 'gemini',
  providerName: 'Gemini',
  apiStyle: 'gemini',
}

export const modelList: LLMModel[] = [
  {
    'id': 'gemini-2.5-flash-image-preview',
    'displayName': 'Nano Banana',
    'supportVision': true,
    'supportTool': true,
    'selected': true,
    provider
  },
  {
    'id': 'gemini-2.5-pro',
    'displayName': 'Gemini 2.5 Pro',
    'supportVision': true,
    'supportTool': true,
    'selected': true,
    provider
  },
  {
    'id': 'gemini-2.5-flash',
    'displayName': 'Gemini 2.5 Flash',
    'supportVision': true,
    'supportTool': true,
    'selected': true,
    provider
  }
]