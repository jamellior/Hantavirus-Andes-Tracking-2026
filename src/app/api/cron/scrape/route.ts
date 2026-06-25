import { NextRequest, NextResponse } from 'next/server';
import { extractAndSave } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const results = await extractAndSave();
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Cron scrape error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
