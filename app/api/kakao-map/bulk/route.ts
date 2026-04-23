import { NextResponse } from 'next/server';
import { addDays, format, parseISO } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { ITEM_STATUSES } from '@/lib/constants';
import type { ApiResponse } from '@/types';

type BulkRequest =
  | { ids: number[]; type: 'status'; status: string }
  | { ids: number[]; type: 'extend'; days: number };

export async function PATCH(request: Request) {
  const body = (await request.json()) as BulkRequest;

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '처리할 항목이 없습니다.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  if (body.type === 'status') {
    if (!(ITEM_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: '올바른 상태값이 아닙니다.' },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from('kakao_map_items')
      .update({ status: body.status as never })
      .in('id', body.ids)
      .select('id');
    if (error) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json<ApiResponse<typeof data>>({ data, error: null });
  }

  if (body.type === 'extend') {
    const days = Number(body.days);
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: '연장 일수가 올바르지 않습니다.' },
        { status: 400 },
      );
    }
    const { data: items, error: readError } = await supabase
      .from('kakao_map_items')
      .select('id, end_date')
      .in('id', body.ids);
    if (readError) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: readError.message },
        { status: 500 },
      );
    }
    const updates = (items ?? []).map((item) => ({
      id: item.id,
      end_date: format(addDays(parseISO(item.end_date), days), 'yyyy-MM-dd'),
      status: '연장처리',
    }));
    for (const u of updates) {
      const { error } = await supabase
        .from('kakao_map_items')
        .update({ end_date: u.end_date, status: u.status as never })
        .eq('id', u.id);
      if (error) {
        return NextResponse.json<ApiResponse<never>>(
          { data: null, error: error.message },
          { status: 500 },
        );
      }
    }
    return NextResponse.json<ApiResponse<typeof updates>>({ data: updates, error: null });
  }

  return NextResponse.json<ApiResponse<never>>(
    { data: null, error: '알 수 없는 작업입니다.' },
    { status: 400 },
  );
}
