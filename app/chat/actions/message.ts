'use server';
import { db } from '@/app/db';
import { auth } from "@/auth";
import { MCPToolResponse } from '@/types/llm';
import { eq, and, asc } from 'drizzle-orm';
import { messages } from '@/app/db/schema';
import { WebSearchResponse } from '@/types/search';

export const clearMessageInServer = async (chatId: string) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'success',
      data: []
    }
  }

  const result = await db.delete(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        eq(messages.userId, session.user.id)
      ));
  return {
    status: 'success',
  }
}
export const deleteMessageInServer = async (messageId: number) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'success',
      data: []
    }
  }

  const result = await db.delete(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.userId, session.user.id)
      ));
  return {
    status: 'success',
  }
}

export const getMessagesInServer = async (chatId: string) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'success',
      data: []
    }
  }
  const result = await db.select()
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        eq(messages.userId, session.user.id),
      ))
    .orderBy(asc(messages.createdAt));
  return {
    status: 'success',
    data: result
  }
}

export const addMessageInServer = async (message: {
  chatId: string,
  role: string,
  content: string | Array<
    {
      type: 'text';
      text: string;
    }
    | {
      type: 'image';
      mimeType: string;
      data: string;
    }
  >,
  reasoninContent?: string,
  mcpTools?: MCPToolResponse[],
  providerId: string,
  model: string,
  type: 'text' | 'image' | 'error' | 'break',
  inputTokens?: number,
  outputTokens?: number,
  totalTokens?: number,
  errorType?: string,
  errorMessage?: string,
}) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'fail',
      message: 'please login first.'
    }
  }

  const [result] = await db.insert(messages)
    .values({
      chatId: message.chatId,
      userId: session.user.id,
      role: message.role,
      content: message.content,
      reasoninContent: message.reasoninContent,
      mcpTools: message.mcpTools,
      model: message.model,
      providerId: message.providerId,
      type: message.type,
      inputTokens: message.inputTokens,
      outputTokens: message.outputTokens,
      totalTokens: message.totalTokens,
      errorType: message.errorType,
      errorMessage: message.errorMessage,
    })
    .returning();
  return result.id;
}

export const updateMessageWebSearchInServer = async (messageId: number, webSearch: WebSearchResponse) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'fail',
      message: 'please login first.'
    }
  }

  try {
    await db.update(messages)
      .set({
        webSearch: webSearch,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.userId, session.user.id)
        ));

    return {
      status: 'success',
      message: '搜索信息已保存'
    };
  } catch (error) {
    console.error('同步搜索响应失败:', error);
    return {
      status: 'fail',
      message: '同步搜索失败'
    };
  }
}