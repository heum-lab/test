'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { QuickDateSelector } from '@/components/common/QuickDateSelector';
import { useAgencyOptions, useSellerOptions } from '@/hooks/useOptions';
import { ITEM_STATUSES, PAGE_SIZE_OPTIONS, type QuickDateKey } from '@/lib/constants';

const DATE_TYPE_OPTIONS = [
  { value: 'expose_start_date', label: '노출시작일' },
  { value: 'guarantee_end_date', label: '보장종료일' },
] as const;
type AcDateType = (typeof DATE_TYPE_OPTIONS)[number]['value'];

export type AutoCompleteFilterState = {
  agency_id: string;
  seller_id: string;
  status: string;
  date_type: AcDateType;
  start: string;
  end: string;
  search: string;
  page_size: number;
  quick?: QuickDateKey;
};

type Props = {
  value: AutoCompleteFilterState;
  onChange: (next: AutoCompleteFilterState) => void;
  onApply: () => void;
  onReset: () => void;
};

export function AutoCompleteFilter({ value, onChange, onApply, onReset }: Props) {
  const { data: agencies = [] } = useAgencyOptions();
  const { data: sellers = [] } = useSellerOptions(
    value.agency_id !== 'all' ? value.agency_id : undefined,
  );

  const set = (patch: Partial<AutoCompleteFilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="mb-4 space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={value.agency_id}
          onValueChange={(v) => set({ agency_id: v, seller_id: 'all' })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="총판" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 총판</SelectItem>
            {agencies.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.seller_id} onValueChange={(v) => set({ seller_id: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="대행사" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 대행사</SelectItem>
            {sellers.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name} ({s.seller_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.status} onValueChange={(v) => set({ status: v })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            {ITEM_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.date_type} onValueChange={(v) => set({ date_type: v as AcDateType })}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          start={value.start}
          end={value.end}
          onChange={(range) => set({ ...range, quick: undefined })}
        />

        <Input
          className="w-56"
          placeholder="키워드 검색"
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onApply()}
        />

        <Select
          value={String(value.page_size)}
          onValueChange={(v) => set({ page_size: Number(v) })}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}개
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={onApply}>검색</Button>
        <Button variant="outline" onClick={onReset}>
          초기화
        </Button>
      </div>

      <QuickDateSelector
        value={value.quick}
        onChange={(r) => set({ start: r.start, end: r.end, quick: r.key })}
      />
    </div>
  );
}
