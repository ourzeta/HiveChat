'use server';
import { searchEngineConfig } from '@/app/db/schema';
import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { auth } from "@/auth";

export async function getDefaultSearchEngineConfig() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const result = await db.query.searchEngineConfig.findFirst({
      where: eq(searchEngineConfig.isActive, true)
    });
    return result;
  } catch (error) {
    throw new Error('query config list fail');
  }
}

export async function setSearchEngineConfig(searchEngineId: string) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    // First, set all search engines to inactive
    await db.update(searchEngineConfig)
      .set({ isActive: false })
      .where(eq(searchEngineConfig.isActive, true));

    // Then, get the target search engine config
    const targetConfig = await db.query.searchEngineConfig.findFirst({
      where: eq(searchEngineConfig.id, searchEngineId)
    });

    if (targetConfig) {
      // If config exists, update it to active
      await db.update(searchEngineConfig)
        .set({ isActive: true })
        .where(eq(searchEngineConfig.id, searchEngineId));
      return targetConfig;
    } else {
      // If config doesn't exist, create a new one
      const newConfig = {
        id: searchEngineId,
        name: searchEngineId === 'tavily' ? 'Tavily' : 'Jina',
        apiKey: '',
        isActive: true,
        extractKeywords: false,
        maxResults: 5,
      };
      await db.insert(searchEngineConfig).values(newConfig);
      return newConfig;
    }
  } catch (error) {
    throw new Error('Failed to set search engine config');
  }
}

export async function saveSearchEngineConfig() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const result = await db.query.searchEngineConfig.findFirst({
      where: eq(searchEngineConfig.isActive, true)
    });
    if (result) {
      return result;
    } else {
      return {
        id: 'tavily',
        name: 'Tavily',
        apiKey: '',
        maxResults: 5,
      }
    }
  } catch (error) {
    throw new Error('query user list fail');
  }
}

export async function updateSearchEngineConfig(config: {
  id: string;
  name: string;
  apiKey: string | null;
  isActive: boolean;
  extractKeywords: boolean;
  maxResults: number;
}) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    await db.update(searchEngineConfig)
      .set(config)
      .where(eq(searchEngineConfig.id, config.id));
    return { status: 'success' };
  } catch (error) {
    throw new Error('update search engine config fail');
  }
}