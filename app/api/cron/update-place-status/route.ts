import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getKstToday(): string {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().slice(0, 10);
}

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 },
      );
    }
  }

  const today = getKstToday();
  const supabase = createAdminClient();

  const { data: started, error: startErr } = await supabase
    .from('place_items')
    .update({ status: '작업중' })
    .eq('status', '대기')
    .lte('start_date', today)
    .select('id');

  if (startErr) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: `start transition failed: ${startErr.message}` },
      { status: 500 },
    );
  }

  const { data: finished, error: endErr } = await supabase
    .from('place_items')
    .update({ status: '작업완료' })
    .eq('status', '작업중')
    .lt('end_date', today)
    .select('id');

  if (endErr) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: `end transition failed: ${endErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json<
    ApiResponse<{ today: string; started: number; finished: number }>
  >({
    data: {
      today,
      started: started?.length ?? 0,
      finished: finished?.length ?? 0,
    },
    error: null,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
