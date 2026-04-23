import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { blogSchema } from '@/lib/validations/blog';
import type { ApiResponse } from '@/types';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const agencyId = searchParams.get('agency_id');
  const sellerId = searchParams.get('seller_id');
  const status = searchParams.get('status');
  const dateType = searchParams.get('date_type') ?? 'start_date';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(150, Math.max(1, Number(searchParams.get('page_size') ?? '50')));
  const sort = searchParams.get('sort') ?? 'start_date';
  const sortDir = (searchParams.get('sort_dir') ?? 'desc') === 'asc' ? 'asc' : 'desc';

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('blog_items')
    .select('*, agencies(name), sellers(name, seller_code)', { count: 'exact' });

  if (agencyId && agencyId !== 'all') query = query.eq('agency_id', Number(agencyId));
  if (sellerId && sellerId !== 'all') query = query.eq('seller_id', Number(sellerId));
  if (status && status !== 'all') query = query.eq('status', status as never);

  if (start && ['start_date', 'end_date', 'order_date', 'payment_date'].includes(dateType)) {
    query = query.gte(dateType, start);
  }
  if (end && ['start_date', 'end_date', 'order_date', 'payment_date'].includes(dateType)) {
    query = query.lte(dateType, end);
  }

  if (search) {
    query = query.or(
      `place_name.ilike.%${search}%,main_keyword.ilike.%${search}%,search_keyword.ilike.%${search}%`,
    );
  }

  query = query.order(sort, { ascending: sortDir === 'asc' }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<typeof data>>({
    data,
    error: null,
    total: count ?? 0,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = blogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_items')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json<ApiResponse<typeof data>>({ data, error: null });
}
