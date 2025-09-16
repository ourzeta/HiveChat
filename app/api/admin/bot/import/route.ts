'use server';
import { NextRequest, NextResponse } from 'next/server';
import { importBotsInServer } from '@/app/admin/bot/action';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bots } = body;

    if (!Array.isArray(bots)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Validate bot data structure
    for (const bot of bots) {
      if (!bot.title || !bot.prompt || !bot.avatar || !bot.avatarType) {
        return NextResponse.json({ error: 'Invalid bot data structure' }, { status: 400 });
      }
    }

    const result = await importBotsInServer(bots);

    return NextResponse.json({
      success: true,
      summary: result.summary,
      // 保持向后兼容
      imported: result.summary.created + result.summary.updated,
      skipped: result.summary.skipped,
      total: result.summary.total
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Import failed' 
    }, { status: 500 });
  }
}
