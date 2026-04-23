import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/constants';

export type Session = {
  userId: string;
  email: string;
  role: UserRole;
  agencyId: number | null;
  sellerId: number | null;
  name: string | null;
};

export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id, seller_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  let name: string | null = null;
  if (profile.role === 'agency' && profile.agency_id) {
    const { data } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', profile.agency_id)
      .maybeSingle();
    name = data?.name ?? null;
  } else if (profile.role === 'seller' && profile.seller_id) {
    const { data } = await supabase
      .from('sellers')
      .select('name')
      .eq('id', profile.seller_id)
      .maybeSingle();
    name = data?.name ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    role: profile.role as UserRole,
    agencyId: profile.agency_id,
    sellerId: profile.seller_id,
    name,
  };
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}
