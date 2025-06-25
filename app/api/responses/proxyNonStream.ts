import { isUserWithinQuota, updateUsage } from '../completions/actions';
import { addMessageInServer } from '@/app/chat/actions/message';

export default async function handleNonStreamResponse(response: Response, messageInfo: {
  chatId?: string,
  model: string,
  userId: string,
  providerId: string
}): Promise<Response> {
  try {
    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      // 如果无法解析为 JSON，直接返回原始文本
      return new Response(responseText, {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'text/plain' },
      });
    }

    // 提取使用量信息和响应内容
    let promptTokens = null;
    let completionTokens = null;
    let totalTokens = null;
    let content = '';

    // 处理不同 API 格式的响应
    if (responseData.usage) {
      // OpenAI 格式
      promptTokens = responseData.usage.input_tokens || null;
      completionTokens = responseData.usage.output_tokens || null;
      totalTokens = responseData.usage.total_tokens || null;

      if (responseData.choices && responseData.choices[0]) {
        content = responseData.choices[0].message?.content || '';
      }
    }

    // 如果有 ChatId，存储消息到数据库
    if (messageInfo.chatId && content) {
      const toAddMessage = {
        chatId: messageInfo.chatId,
        content: content,
        role: 'assistant',
        type: 'text' as const,
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        totalTokens: totalTokens,
        model: messageInfo.model,
        providerId: messageInfo.providerId,
      };

      const messageId = await addMessageInServer(toAddMessage);
    }

    // 更新使用量统计
    await updateUsage(messageInfo.userId, {
      chatId: messageInfo.chatId,
      date: new Date().toISOString().split('T')[0],
      userId: messageInfo.userId,
      modelId: messageInfo.model,
      providerId: messageInfo.providerId,
      inputTokens: promptTokens || 0,
      outputTokens: completionTokens || 0,
      totalTokens: totalTokens || 0,
    });

    return new Response(responseText, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error handling non-stream response:', error);
    return new Response(JSON.stringify({ error: 'Failed to process response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}