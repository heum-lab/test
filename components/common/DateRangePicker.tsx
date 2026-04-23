'use client';

import { Input } from '@/components/ui/input';

type Props = {
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
};

export function DateRangePicker({ start, end, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        className="w-36"
        value={start}
        onChange={(e) => onChange({ start: e.target.value, end })}
      />
      <span className="text-[var(--color-muted-foreground)]">~</span>
      <Input
        type="date"
        className="w-36"
        value={end}
        onChange={(e) => onChange({ start, end: e.target.value })}
      />
    </div>
  );
}
