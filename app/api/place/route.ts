import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { placeSchema } from '@/lib/validations/place';
import type { ApiResponse } from '@/types';

// 정렬 허용 컬럼: UI 키 → PostgREST order 식
// (총판/대행사는 연관 테이블 이름 기준 정렬)
const SORT_COLUMNS: Record<string, string> = {
  id: 'id',
  agency: 'agencies(name)',
  seller: 'sellers(name)',
  store_name: 'store_name',
  main_keyword: 'main_keyword',
  search_keyword: 'search_keyword',
  logic: 'logic',
  order_date: 'order_date',
  start_date: 'start_date',
  end_date: 'end_date',
  // 구동일은 화면상 "남은 일수(종료일−오늘)"로 표시 → 모든 행에 오늘이 동일하므로
  // 남은 일수 정렬은 종료일 정렬과 동일(오름차순 = 종료 임박/남은 일수 적은 순)
  running_days: 'end_date',
  traffic_count: 'traffic_count',
  payment_date: 'payment_date',
  status: 'status',
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }
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
  const sortKey = searchParams.get('sort') ?? 'start_date';
  const orderExpr = SORT_COLUMNS[sortKey] ?? 'start_date';
  const sortDir = (searchParams.get('sort_dir') ?? 'desc') === 'asc' ? 'asc' : 'desc';

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('place_items')
    .select('*, agencies(name), sellers(name, seller_code)', { count: 'exact' });

  if (session.role === 'agency' && session.agencyId) {
    const { data: ownSellers } = await supabase
      .from('sellers')
      .select('id')
      .eq('agency_id', session.agencyId);
    const sellerIds = (ownSellers ?? []).map((s) => s.id);
    const conditions = [`agency_id.eq.${session.agencyId}`];
    if (sellerIds.length > 0) conditions.push(`seller_id.in.(${sellerIds.join(',')})`);
    query = query.or(conditions.join(','));
  } else if (session.role === 'seller' && session.sellerId) {
    query = query.eq('seller_id', session.sellerId);
  }

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
      `store_name.ilike.%${search}%,main_keyword.ilike.%${search}%,search_keyword.ilike.%${search}%`,
    );
  }

  query = query.order(orderExpr, { ascending: sortDir === 'asc' }).range(from, to);

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
  const parsed = placeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('place_items')
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
