'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = buildPageWindow(page, totalPages, 5);

  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <div className="text-[var(--color-muted-foreground)]">
        {total === 0 ? '0건' : `${start}–${end} / ${total}건`}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === page ? 'default' : 'outline'}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function buildPageWindow(current: number, total: number, size: number): number[] {
  const half = Math.floor(size / 2);
  let from = Math.max(1, current - half);
  const to = Math.min(total, from + size - 1);
  from = Math.max(1, to - size + 1);
  const result: number[] = [];
  for (let i = from; i <= to; i += 1) result.push(i);
  return result;
}
