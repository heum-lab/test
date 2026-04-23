import { NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import { MODULE_TABLES, type ModuleKey } from './columns';

type BulkUploadBody = {
  agency_id: number;
  seller_id: number;
  rows: Record<string, unknown>[];
};

export type BulkUploadResult = {
  inserted: number;
  failed: number;
  errors: { index: number; message: string }[];
};

const BATCH_SIZE = 100;

export async function handleExcelUpload<TSchema extends ZodSchema>(
  request: Request,
  opts: { moduleKey: ModuleKey; schema: TSchema },
) {
  const body = (await request.json()) as BulkUploadBody;

  if (!body.agency_id || !body.seller_id) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '총판와 대행사를 선택해 주세요.' },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: '업로드할 행이 없습니다.' },
      { status: 400 },
    );
  }

  const validRows: unknown[] = [];
  const errors: BulkUploadResult['errors'] = [];

  body.rows.forEach((row, idx) => {
    const merged = { ...row, agency_id: body.agency_id, seller_id: body.seller_id };
    const parsed = opts.schema.safeParse(merged);
    if (parsed.success) {
      validRows.push(parsed.data);
    } else {
      errors.push({
        index: idx + 2,
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
      });
    }
  });

  if (validRows.length === 0) {
    return NextResponse.json<ApiResponse<BulkUploadResult>>({
      data: { inserted: 0, failed: errors.length, errors },
      error: null,
    });
  }

  const supabase = await createClient();
  const table = MODULE_TABLES[opts.moduleKey];
  let inserted = 0;

  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const chunk = validRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(chunk as any);
    if (error) {
      chunk.forEach((_, j) => {
        errors.push({ index: i + j + 2, message: error.message });
      });
    } else {
      inserted += chunk.length;
    }
  }

  return NextResponse.json<ApiResponse<BulkUploadResult>>({
    data: { inserted, failed: errors.length, errors },
    error: null,
  });
}
