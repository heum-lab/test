import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { agencyCreateSchema } from '@/lib/validations/agency';
import type { ApiResponse } from '@/types';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();
  const approved = searchParams.get('approved');

  let query = supabase.from('agencies').select('*', { count: 'exact' });

  if (approved === 'true') query = query.eq('is_approved', true);
  if (approved === 'false') query = query.eq('is_approved', false);
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
  if (session.role !== 'super_admin') {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '슈퍼관리자만 등록할 수 있습니다.' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = agencyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const { name, username, email, password, phone, memo, is_approved } = parsed.data;
  const admin = createAdminClient();

  const { data: dup } = await admin
    .from('agencies')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (dup) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '이미 사용 중인 아이디입니다.' },
      { status: 409 },
    );
  }

  const { data: agency, error: insertError } = await admin
    .from('agencies')
    .insert({
      parent_name: '',
      name,
      username,
      phone,
      email,
      memo: memo || null,
      is_approved,
    })
    .select('*')
    .single();

  if (insertError || !agency) {
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
      role: 'agency',
      agency_id: String(agency.id),
      name,
    },
  });

  if (signUpError) {
    await admin.from('agencies').delete().eq('id', agency.id);
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: signUpError.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<typeof agency>>({ data: agency, error: null });
}
