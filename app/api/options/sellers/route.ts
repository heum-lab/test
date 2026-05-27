import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse } from '@/types';

export type SellerOption = {
  id: number;
  seller_code: number;
  name: string;
  agency_id: number | null;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const agencyIdParam = searchParams.get('agency_id');

  // RLS 우회 후 세션 역할 기준으로 명시적 스코프.
  //  - super_admin : 전체 (agency_id 파라미터로 좁힐 수 있음)
  //  - agency(총판) : 자신이 등록한 하위 대행사만
  //  - seller(대행사): 자신만
  const admin = createAdminClient();
  let query = admin.from('sellers').select('id, seller_code, name, agency_id');

  if (session.role === 'super_admin') {
    if (agencyIdParam) query = query.eq('agency_id', Number(agencyIdParam));
  } else if (session.role === 'agency') {
    if (session.agencyId == null) {
      return NextResponse.json<ApiResponse<SellerOption[]>>({ data: [], error: null });
    }
    query = query.eq('agency_id', session.agencyId).eq('is_approved', true);
  } else if (session.role === 'seller') {
    if (session.sellerId == null) {
      return NextResponse.json<ApiResponse<SellerOption[]>>({ data: [], error: null });
    }
    query = query.eq('id', session.sellerId);
  } else {
    return NextResponse.json<ApiResponse<SellerOption[]>>({ data: [], error: null });
  }

  const { data, error } = await query.order('name');

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<SellerOption[]>>({
    data: data ?? [],
    error: null,
  });
}
