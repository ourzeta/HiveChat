'use server';
import { NextRequest, NextResponse } from 'next/server';
import { getAllBotsInServer, getBotListInServer } from '@/app/admin/bot/action';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'current' or 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');
    const searchQuery = searchParams.get('searchQuery') || undefined;

    let botsData;
    if (type === 'all') {
      botsData = await getAllBotsInServer();
    } else {
      botsData = await getBotListInServer(page, pageSize, searchQuery);
    }

    if (botsData.status !== 'success') {
      return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 });
    }

    // Format data for export (remove unnecessary fields)
    const exportData = botsData.data.map(bot => ({
      title: bot.title,
      desc: bot.desc,
      prompt: bot.prompt,
      avatar: bot.avatar,
      avatarType: bot.avatarType
    }));

    const response = NextResponse.json({
      data: exportData,
      exportedAt: new Date().toISOString(),
      count: exportData.length
    });

    // Set filename for download
    const filename = type === 'all' ? 'all-bots.json' : `bots-page-${page}.json`;
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return response;
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}