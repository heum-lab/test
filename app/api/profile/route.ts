import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse } from '@/types';

type ProfileRow = {
  role: 'super_admin' | 'agency' | 'seller';
  userId: string;
  email: string;
  name: string;
  username: string;
  phone: string | null;
  memo: string | null;
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }

  const admin = createAdminClient();

  if (session.role === 'agency' && session.agencyId) {
    const { data, error } = await admin
      .from('agencies')
      .select('name, username, phone, email, memo')
      .eq('id', session.agencyId)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: error?.message ?? '프로필을 찾을 수 없습니다.' },
        { status: 500 },
      );
    }
    return NextResponse.json<ApiResponse<ProfileRow>>({
      data: {
        role: 'agency',
        userId: session.userId,
        email: data.email ?? session.email,
        name: data.name,
        username: data.username,
        phone: data.phone,
        memo: data.memo,
      },
      error: null,
    });
  }

  if (session.role === 'seller' && session.sellerId) {
    const { data, error } = await admin
      .from('sellers')
      .select('name, username, phone, email, memo')
      .eq('id', session.sellerId)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: error?.message ?? '프로필을 찾을 수 없습니다.' },
        { status: 500 },
      );
    }
    return NextResponse.json<ApiResponse<ProfileRow>>({
      data: {
        role: 'seller',
        userId: session.userId,
        email: data.email ?? session.email,
        name: data.name,
        username: data.username,
        phone: data.phone,
        memo: data.memo,
      },
      error: null,
    });
  }

  return NextResponse.json<ApiResponse<ProfileRow>>({
    data: {
      role: 'super_admin',
      userId: session.userId,
      email: session.email,
      name: '슈퍼관리자',
      username: '',
      phone: null,
      memo: null,
    },
    error: null,
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    email?: string;
    memo?: string;
    password?: string;
  };

  const admin = createAdminClient();
  const profileUpdate: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    memo?: string | null;
  } = {};
  if (typeof body.name === 'string' && body.name.trim()) profileUpdate.name = body.name.trim();
  if (typeof body.phone === 'string') profileUpdate.phone = body.phone.trim();
  if (typeof body.email === 'string' && body.email.trim()) profileUpdate.email = body.email.trim();
  if (typeof body.memo === 'string') profileUpdate.memo = body.memo.trim() || null;

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '올바른 이메일 형식이 아닙니다.' },
      { status: 400 },
    );
  }
  if (body.password && body.password.length < 8) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '비밀번호는 8자 이상이어야 합니다.' },
      { status: 400 },
    );
  }

  if (session.role === 'agency' && session.agencyId) {
    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await admin
        .from('agencies')
        .update(profileUpdate)
        .eq('id', session.agencyId);
      if (error) {
        return NextResponse.json<ApiResponse<never>>(
          { data: null, error: error.message },
          { status: 500 },
        );
      }
    }
  } else if (session.role === 'seller' && session.sellerId) {
    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await admin
        .from('sellers')
        .update(profileUpdate)
        .eq('id', session.sellerId);
      if (error) {
        return NextResponse.json<ApiResponse<never>>(
          { data: null, error: error.message },
          { status: 500 },
        );
      }
    }
  }

  if (body.email || body.password) {
    const authPatch: { email?: string; password?: string } = {};
    if (body.email) authPatch.email = body.email.trim();
    if (body.password) authPatch.password = body.password;
    const { error } = await admin.auth.admin.updateUserById(session.userId, authPatch);
    if (error) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true }, error: null });
}
