import { NextRequest, NextResponse } from 'next/server';
import { cleanJobs } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const results = await cleanJobs();
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Cron clean error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
