import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

export type AgencyOption = {
  id: number;
  parent_name: string;
  name: string;
};

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agencies')
    .select('id, parent_name, name')
    .eq('is_approved', true)
    .order('name');

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
