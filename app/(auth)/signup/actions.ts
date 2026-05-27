'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { agencySignupSchema, sellerSignupSchema } from '@/lib/validations/signup';

export type SignupState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

function toFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    result[issue.path[0] as string] = issue.message;
  }
  return result;
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const role = formData.get('role');

  const raw = Object.fromEntries(formData.entries());

  if (role === 'agency') {
    const parsed = agencySignupSchema.safeParse(raw);
    if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

    const { email, password, name, username, phone, memo, agency_name } = parsed.data;

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('agencies')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existing) return { fieldErrors: { username: '이미 사용 중인 아이디입니다.' } };

    const { data: agency, error: agencyError } = await admin
      .from('agencies')
      .insert({
        parent_name: '',
        name: agency_name,
        username,
        phone,
        email,
        memo: memo || null,
        is_approved: false,
      })
      .select('id')
      .single();

    if (agencyError || !agency) {
      return { error: '총판 등록에 실패했습니다.' };
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
      return { error: signUpError.message };
    }

    return { success: true };
  }

  if (role === 'seller') {
    const parsed = sellerSignupSchema.safeParse(raw);
    if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

    const { email, password, name, username, phone, memo, agency_id } = parsed.data;
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('sellers')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existing) return { fieldErrors: { username: '이미 사용 중인 아이디입니다.' } };

    const { data: lastSeller } = await admin
      .from('sellers')
      .select('seller_code')
      .order('seller_code', { ascending: false })
      .limit(1)
      .maybeSingle();
    const seller_code = (lastSeller?.seller_code ?? 9999) + 1;

    const { data: seller, error: sellerError } = await admin
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
        is_approved: false,
      })
      .select('id')
      .single();

    if (sellerError || !seller) return { error: '대행사 등록에 실패했습니다.' };

    const { error: signUpError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'seller',
        seller_id: String(seller.id),
        agency_id: String(agency_id),
        name,
      },
    });

    if (signUpError) {
      await admin.from('sellers').delete().eq('id', seller.id);
      return { error: signUpError.message };
    }

    return { success: true };
  }

  return { error: '역할을 선택해 주세요.' };
}
