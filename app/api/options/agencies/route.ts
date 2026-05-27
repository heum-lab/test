import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse } from '@/types';

export type AgencyOption = {
  id: number;
  parent_name: string;
  name: string;
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }

  // RLS 우회 후 세션 역할 기준으로 명시적 스코프.
  //  - super_admin : 모든 총판
  //  - agency(총판) : 자신 총판만
  //  - seller(대행사): 상위 총판만 (session.agencyId 로 유도)
  const admin = createAdminClient();
  let query = admin.from('agencies').select('id, parent_name, name');

  if (session.role !== 'super_admin') {
    if (session.agencyId == null) {
      return NextResponse.json<ApiResponse<AgencyOption[]>>({ data: [], error: null });
    }
    query = query.eq('id', session.agencyId);
  }

  const { data, error } = await query.order('name');

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<AgencyOption[]>>({
    data: data ?? [],
    error: null,
  });
}
