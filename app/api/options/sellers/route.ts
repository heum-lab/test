import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

export type SellerOption = {
  id: number;
  seller_code: number;
  name: string;
  agency_id: number | null;
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get('agency_id');

  let query = supabase
    .from('sellers')
    .select('id, seller_code, name, agency_id')
    .eq('is_approved', true);

  if (agencyId) {
    query = query.eq('agency_id', Number(agencyId));
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
