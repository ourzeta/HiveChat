'use server';
import { db } from '@/app/db';
import { auth } from "@/auth";
import { eq, and, or, desc, count, ilike, SQL } from 'drizzle-orm'
import { chats, bots } from '@/app/db/schema';

export const addBotInServer = async (botInfo: {
  title: string;
  desc?: string;
  prompt: string;
  avatar: string;
  avatarType: 'emoji' | 'url';
}) => {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }

  const botResult = await db.insert(bots)
    .values({
      ...botInfo,
      creator: 'public'
    })
    .returning();
  return {
    status: 'success',
    data: botResult[0]
  }
}

export const updateBotInServer = async (botId: number, botInfo: {
  title: string;
  desc?: string;
  prompt: string;
  avatar: string;
  avatarType: 'emoji' | 'url';
}) => {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }

  const botResult = await db.update(bots)
    .set({
      ...botInfo,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(bots.id, botId),
        eq(bots.creator, 'public')
      )
    )
    .returning();
    
  if (botResult.length === 0) {
    throw new Error('Bot not found');
  }
  
  return {
    status: 'success',
    data: botResult[0]
  }
}

export const deleteBotInServer = async (botId: number) => {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }

  await db.delete(bots)
    .where(
      and(
        eq(bots.id, botId),
        eq(bots.creator, 'public')
      ));
  return {
    status: 'success'
  }
}

export const getBotListInServer = async (page: number = 1, pageSize: number = 12, searchQuery?: string) => {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  
  const offset = (page - 1) * pageSize;
  
  let finalCondition = eq(bots.creator, 'public');
  
  if (searchQuery && searchQuery.trim()) {
    const searchCondition = or(
      ilike(bots.title, `%${searchQuery.trim()}%`),
      ilike(bots.desc, `%${searchQuery.trim()}%`)
    );
    if (searchCondition) {
      finalCondition = and(finalCondition, searchCondition)!;
    }
  }
  
  const [result, totalResult] = await Promise.all([
    db.select()
      .from(bots)
      .where(finalCondition)
      .orderBy(desc(bots.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() })
      .from(bots)
      .where(finalCondition)
  ]);
  
  const total = totalResult[0]?.count || 0;
  
  if (result.length > 0 || page === 1) {
    return {
      status: 'success',
      data: result,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  } else {
    return {
      status: 'fail',
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    }
  }
}

export const getBotInfoInServer = async (botId: number) => {

  const result = await db.select()
    .from(bots)
    .where(
      eq(bots.id, botId),
    );
  if (result.length > 0) {
    return {
      status: 'success',
      data: result[0]
    }
  } else {
    return {
      status: 'fail',
    }
  }
}

export const getAllBotsInServer = async () => {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }

  const result = await db.select()
    .from(bots)
    .where(eq(bots.creator, 'public'))
    .orderBy(desc(bots.createdAt));

  return {
    status: 'success',
    data: result
  }
}

export const importBotsInServer = async (botsData: Array<{
  title: string;
  desc?: string;
  prompt: string;
  avatar: string;
  avatarType: 'emoji' | 'url';
}>) => {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }

  const results = [];
  let skippedCount = 0;
  
  for (const botData of botsData) {
    try {
      // 检查是否存在相同标题的智能体
      const existingBot = await db.select()
        .from(bots)
        .where(
          and(
            eq(bots.title, botData.title),
            eq(bots.creator, 'public')
          )
        )
        .limit(1);
      
      if (existingBot.length > 0) {
        // 如果存在，更新现有智能体
        const updatedBot = await db.update(bots)
          .set({
            desc: botData.desc,
            prompt: botData.prompt,
            avatar: botData.avatar,
            avatarType: botData.avatarType,
            updatedAt: new Date()
          })
          .where(eq(bots.id, existingBot[0].id))
          .returning();
        results.push(updatedBot[0]);
      } else {
        // 如果不存在，创建新智能体
        const botResult = await db.insert(bots)
          .values({
            ...botData,
            creator: 'public'
          })
          .returning();
        results.push(botResult[0]);
      }
    } catch (error) {
      console.error('Failed to import bot:', botData.title, error);
      skippedCount++;
    }
  }

  return {
    status: 'success',
    data: results,
    imported: results.length,
    skipped: skippedCount,
    total: botsData.length
  }
}