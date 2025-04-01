'use server';
import { db } from '@/app/db';
import { eq, and, sql } from 'drizzle-orm'
import { chats, usageReport, users } from '@/app/db/schema';

type UsageType = {
  inputTokens: number,
  outputTokens: number,
  totalTokens: number,
}

type UsageDetail = {
  chatId?: string,
  date: string,
  userId: string,
  modelId: string,
  providerId: string,
  inputTokens: number,
  outputTokens: number,
  totalTokens: number,
}

export const isUserWithinQuota = async (userId: string): Promise<boolean> => {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      group: {
        columns: {
          tokenLimitType: true,
          dailyTokenLimit: true,
        }
      }
    }
  });
  if (result && result.group) {
    const { tokenLimitType, dailyTokenLimit } = result.group;
    const dailyTokenLimitNumber = dailyTokenLimit || 0;
    if (tokenLimitType === 'unlimited') {
      return true;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let realTodayTotalTokens = 0;
      if (result.usageUpdatedAt > today) {
        realTodayTotalTokens = result.todayTotalTokens;
      }

      if (realTodayTotalTokens < dailyTokenLimitNumber) {
        return true;
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}

export const updateUsage = async (userId: string, usage: UsageDetail) => {
  updateUserUsage(userId, {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  });

  if (usage.chatId) {
    updateChatUsage(usage.chatId, {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
    });
  }
  updateUsageReport(usage);
}

export const updateUserUsage = async (userId: string, usage: UsageType) => {
  const userDetail = await db.query.users
    .findFirst({
      where: eq(users.id, userId)
    });
  // 获取今天0点的时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (userDetail?.usageUpdatedAt && new Date(userDetail.usageUpdatedAt) < today) {
    // 如果最后更新时间早于今天0点，重置计数
    await db.update(users).set({
      todayTotalTokens: usage.totalTokens,
      usageUpdatedAt: new Date(),
    })
      .where(eq(users.id, userId));
  } else {
    // 如果是今天内的更新，累加计数
    await db.update(users).set({
      todayTotalTokens: sql`${users.todayTotalTokens} + ${usage.totalTokens}`,
      usageUpdatedAt: new Date(),
    })
      .where(eq(users.id, userId));
  }
}

const updateChatUsage = async (chatId: string, usage: UsageType) => {
  await db.update(chats).set({
    inputTokens: sql`${chats.inputTokens} + ${usage.inputTokens}`,
    outputTokens: sql`${chats.outputTokens} + ${usage.outputTokens}`,
    totalTokens: sql`${chats.totalTokens} + ${usage.totalTokens}`,
  })
    .where(eq(chats.id, chatId))
}

const updateUsageReport = async (updateRecord: UsageDetail) => {
  const existingRecord = await db.select()
    .from(usageReport)
    .where(
      and(
        eq(usageReport.date, updateRecord.date),
        eq(usageReport.userId, updateRecord.userId),
        eq(usageReport.modelId, updateRecord.modelId),
        eq(usageReport.providerId, updateRecord.providerId)
      )
    )
    .limit(1);

  if (existingRecord.length > 0) {
    // 如果记录存在，更新tokens值
    await db.update(usageReport)
      .set({
        inputTokens: sql`${usageReport.inputTokens} + ${updateRecord.inputTokens}`,
        outputTokens: sql`${usageReport.outputTokens} + ${updateRecord.outputTokens}`,
        totalTokens: sql`${usageReport.totalTokens} + ${updateRecord.totalTokens}`,
      })
      .where(
        and(
          eq(usageReport.date, updateRecord.date),
          eq(usageReport.userId, updateRecord.userId),
          eq(usageReport.modelId, updateRecord.modelId),
          eq(usageReport.providerId, updateRecord.providerId)
        )
      );
  } else {
    // 如果记录不存在，插入新记录
    await db.insert(usageReport).values(updateRecord);
  }
}