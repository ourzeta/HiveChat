import { ChatOptions, RequestMessage } from '@/types/llm';
import { ResponseContent } from '@/types/llm';
import ChatGPTApi from '@/app/provider/OpenAIProvider';
import Claude from '@/app/provider/ClaudeProvider';
import GeminiApi from '@/app/provider/GeminiProvider';

export function prettyObject(msg: any) {
  const obj = msg;
  if (typeof msg !== "string") {
    msg = JSON.stringify(msg, null, "  ");
  }
  if (msg === "{}") {
    return obj.toString();
  }
  if (msg.startsWith("```json")) {
    return msg;
  }
  return ["```json", msg, "```"].join("\n");
}

export function generateTitle(messages: RequestMessage[],
  model: string,
  providerId: string,
  onFinish: (message: string) => void,
  onError: () => void
) {
  const llmApi = getLLMInstance(providerId);
  const toSendMessages: RequestMessage[] = [...messages, {
    role: "user",
    content: "使用4到8个字直接返回这句话的简要主题，在 8 个字以内，不要解释、不要标点、不要语气词、不要多余文本，不要加粗，如果没有主题，请直接返回“闲聊”"
  }];
  const options: ChatOptions = {
    messages: toSendMessages,
    config: { model: model },
    onUpdate: (responseContent: ResponseContent) => {
    },
    onFinish: async (responseContent: ResponseContent) => {
      onFinish(responseContent.content as string);
    },
    onError: async (err?: Error) => {
      onError();
    },
  }
  llmApi.chat(options);
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => {
      console.error('Error converting file to base64:', error);
      reject(new Error('Failed to convert file to base64'));
    };
  });
};

export const getLLMInstance = (providerId: string) => {
  let llmApi;
  switch (providerId) {
    case 'claude':
      llmApi = new Claude();
      break;
    case 'gemini':
      llmApi = new GeminiApi();
      break;
    default:
      llmApi = new ChatGPTApi(providerId);
      break;
  }
  return llmApi;
}