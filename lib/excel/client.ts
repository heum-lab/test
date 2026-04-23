'use client';

import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { EXCEL_COLUMNS, MODULE_LABELS, type ExcelColumn, type ModuleKey } from './columns';

type Row = Record<string, unknown>;

/** 엑셀 파일(.xlsx)을 파싱하여 모듈의 field 키 기준 객체 배열로 변환 */
export async function parseExcelFile(
  file: File,
  moduleKey: ModuleKey,
): Promise<{ rows: Row[]; skipped: number }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return { rows: [], skipped: 0 };

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    raw: true,
    defval: null,
  });

  const columns = EXCEL_COLUMNS[moduleKey];
  const rows: Row[] = [];
  let skipped = 0;

  for (const rawRow of raw) {
    const row: Row = {};
    let hasAny = false;
    for (const col of columns) {
      const rawValue = rawRow[col.header];
      const value = coerce(rawValue, col);
      if (value !== undefined && value !== null && value !== '') {
        row[col.field] = value;
        hasAny = true;
      }
    }
    if (hasAny) rows.push(row);
    else skipped += 1;
  }

  return { rows, skipped };
}

function coerce(value: unknown, col: ExcelColumn): unknown {
  if (value === null || value === undefined || value === '') return undefined;

  if (col.type === 'date') {
    if (value instanceof Date) return format(value, 'yyyy-MM-dd');
    if (typeof value === 'string') {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
      return value;
    }
    return String(value);
  }

  if (col.type === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  return typeof value === 'string' ? value.trim() : value;
}

/** 빈 양식(헤더만)을 내려받음 */
export function downloadTemplate(moduleKey: ModuleKey) {
  const columns = EXCEL_COLUMNS[moduleKey];
  const headers = columns.map((c) => c.header);

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  ws['!cols'] = columns.map(() => ({ wch: 16 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, MODULE_LABELS[moduleKey]);

  XLSX.writeFile(wb, `${moduleKey}-양식-${format(new Date(), 'yyyyMMdd')}.xlsx`);
}

/** 현재 결과(행 배열)를 엑셀로 내려받음 — 표시용 확장 컬럼 포함 */
export function downloadRows(
  moduleKey: ModuleKey,
  items: Array<Record<string, unknown>>,
  opts?: { agencyNameKey?: string; sellerNameKey?: string },
) {
  const columns = EXCEL_COLUMNS[moduleKey];
  const agencyKey = opts?.agencyNameKey ?? 'agency_name';
  const sellerKey = opts?.sellerNameKey ?? 'seller_name';

  const headerRow = ['총판', '대행사', ...columns.map((c) => c.header)];

  const data = items.map((item) => {
    const agencies = (item.agencies as { name?: string } | null) ?? null;
    const sellers = (item.sellers as { name?: string; seller_code?: number } | null) ?? null;
    const agencyName =
      (item[agencyKey] as string | undefined) ?? agencies?.name ?? '';
    const sellerName =
      (item[sellerKey] as string | undefined) ??
      (sellers ? `${sellers.name}(${sellers.seller_code ?? ''})` : '');

    const cells = columns.map((c) => item[c.field] ?? '');
    return [agencyName, sellerName, ...cells];
  });

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...data]);
  ws['!cols'] = headerRow.map(() => ({ wch: 16 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, MODULE_LABELS[moduleKey]);

  XLSX.writeFile(wb, `${moduleKey}-내보내기-${format(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`);
}
