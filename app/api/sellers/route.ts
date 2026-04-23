import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { sellerCreateSchema } from '@/lib/validations/seller';
import type { ApiResponse } from '@/types';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();
  const approved = searchParams.get('approved');
  const agencyId = searchParams.get('agency_id');

  let query = supabase.from('sellers').select('*, agencies(name)', { count: 'exact' });

  if (approved === 'true') query = query.eq('is_approved', true);
  if (approved === 'false') query = query.eq('is_approved', false);
  if (agencyId) query = query.eq('agency_id', Number(agencyId));
  if (search) {
    query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
  }

  const { data, error, count } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<typeof data>>({
    data,
    error: null,
    total: count ?? data.length,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }
  if (session.role !== 'super_admin' && session.role !== 'agency') {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '권한이 없습니다.' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = sellerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const { agency_id, name, username, email, password, phone, memo, is_approved } = parsed.data;

  if (session.role === 'agency' && session.agencyId !== agency_id) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '본인 소속 총판만 등록할 수 있습니다.' },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  const { data: agencyExists } = await admin
    .from('agencies')
    .select('id')
    .eq('id', agency_id)
    .maybeSingle();
  if (!agencyExists) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '소속 총판을 찾을 수 없습니다.' },
      { status: 400 },
    );
  }

  const { data: dup } = await admin
    .from('sellers')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (dup) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '이미 사용 중인 아이디입니다.' },
      { status: 409 },
    );
  }

  const { data: lastSeller } = await admin
    .from('sellers')
    .select('seller_code')
    .order('seller_code', { ascending: false })
    .limit(1)
    .maybeSingle();
  const seller_code = (lastSeller?.seller_code ?? 9999) + 1;

  const { data: seller, error: insertError } = await admin
    .from('sellers')
    .insert({
      seller_code,
      parent_name: '',
      agency_id,
      name,
      username,
      phone,
      email,
      memo: memo || null,
      is_approved,
    })
    .select('*, agencies(name)')
    .single();

  if (insertError || !seller) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: insertError?.message ?? '등록에 실패했습니다.' },
      { status: 500 },
    );
  }

  const { error: signUpError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'seller',
      seller_id: String(seller.id),
      name,
    },
  });

  if (signUpError) {
    await admin.from('sellers').delete().eq('id', seller.id);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: signUpError.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<typeof seller>>({ data: seller, error: null });
}
