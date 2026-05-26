import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse } from '@/types';

export type AgencyOption = {
  id: number;
  parent_name: string;
  name: string;
};

export async function GET() {
  const supabase = await createClient();
  const session = await getSession();

  let query = supabase.from('agencies').select('id, parent_name, name');
  if (session?.role !== 'super_admin') {
    query = query.eq('is_approved', true);
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
