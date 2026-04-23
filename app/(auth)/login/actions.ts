'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as string] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id, seller_id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: '프로필 정보가 없습니다. 관리자에게 문의해 주세요.' };
  }

  if (profile.role === 'agency' && profile.agency_id) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('is_approved')
      .eq('id', profile.agency_id)
      .maybeSingle();
    if (!agency?.is_approved) {
      await supabase.auth.signOut();
      return { error: '승인 대기 중인 계정입니다.' };
    }
  }

  if (profile.role === 'seller' && profile.seller_id) {
    const { data: seller } = await supabase
      .from('sellers')
      .select('is_approved')
      .eq('id', profile.seller_id)
      .maybeSingle();
    if (!seller?.is_approved) {
      await supabase.auth.signOut();
      return { error: '승인 대기 중인 계정입니다.' };
    }
  }

  redirect('/admin/dashboard');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
