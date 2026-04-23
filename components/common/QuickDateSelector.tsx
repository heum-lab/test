'use client';

import { Button } from '@/components/ui/button';
import { QUICK_DATE_OPTIONS, type QuickDateKey } from '@/lib/constants';
import { resolveQuickDateRange } from '@/lib/dateRanges';

type Props = {
  value?: QuickDateKey;
  onChange: (range: { start: string; end: string; key: QuickDateKey }) => void;
};

export function QuickDateSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {QUICK_DATE_OPTIONS.map((opt) => (
        <Button
          key={opt.key}
          size="sm"
          variant={value === opt.key ? 'default' : 'outline'}
          onClick={() => {
            const range = resolveQuickDateRange(opt.key);
            onChange({ ...range, key: opt.key });
          }}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
