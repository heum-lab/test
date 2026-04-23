import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('place_items')
    .update(body)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json<ApiResponse<typeof data>>({ data, error: null });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('place_items').delete().eq('id', Number(id));

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json<ApiResponse<{ id: number }>>({
    data: { id: Number(id) },
    error: null,
  });
}
