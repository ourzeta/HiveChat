'use server';
import { db } from '@/app/db';
import { auth } from "@/auth";
import { eq, and, or, desc, count, ilike } from 'drizzle-orm'
import { chats, bots } from '@/app/db/schema';

export const addBotInServer = async (botInfo: {
  title: string;
  desc?: string;
  prompt: string;
  avatar: string;
  avatarType: 'emoji' | 'url';
}) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'fail',
      message: 'please login first.'
    }
  }

  const botResult = await db.insert(bots)
    .values({
      ...botInfo,
      creator: session.user.id
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
  if (!session?.user.id) {
    return {
      status: 'fail',
      message: 'please login first.'
    }
  }

  const botResult = await db.update(bots)
    .set({
      ...botInfo,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(bots.id, botId),
        eq(bots.creator, session.user.id)
      )
    )
    .returning();
    
  if (botResult.length === 0) {
    return {
      status: 'fail',
      message: 'Bot not found or you do not have permission to update it.'
    }
  }
  
  return {
    status: 'success',
    data: botResult[0]
  }
}

export const deleteBotInServer = async (botId: number) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'fail',
      message: 'please login first.'
    }
  }

  await db.delete(bots)
    .where(
      and(
        eq(bots.id, botId),
        eq(bots.creator, session.user.id)
      ));
  return {
    status: 'success'
  }
}

export const addBotToChatInServer = async (botId: number) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'fail',
      message: 'please login first.'
    }
  }

  const result = await db.select()
    .from(bots)
    .where(
      eq(bots.id, botId),
    );
  if (result.length > 0) {
    const botInfo = result[0];
    const safeTitle = botInfo.title.length > 255 ? botInfo.title.slice(0, 255) : botInfo.title;
    const chatResult = await db.insert(chats)
      .values({
        title: safeTitle,
        botId: botInfo.id,
        avatar: botInfo.avatar,
        avatarType: botInfo.avatarType,
        isWithBot: true,
        prompt: botInfo.prompt,
        userId: session.user.id
      })
      .returning();
    return {
      status: 'success',
      data: chatResult[0]
    }
  } else {
    return {
      status: 'fail',
    }
  }
}

export const getBotListInServer = async (page: number = 1, pageSize: number = 12, searchQuery?: string) => {
  const session = await auth();
  if (!session?.user.id) {
    return {
      status: 'fail',
      data: [],
      total: 0,
      message: 'please login first.'
    }
  }
  
  const offset = (page - 1) * pageSize;
  
  let baseCondition = or(
    eq(bots.creator, session?.user.id),
    eq(bots.creator, 'public'),
  );

  let finalCondition = baseCondition;
  
  if (searchQuery && searchQuery.trim()) {
    const searchCondition = or(
      ilike(bots.title, `%${searchQuery.trim()}%`),
      ilike(bots.desc, `%${searchQuery.trim()}%`)
    );
    finalCondition = and(baseCondition, searchCondition);
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