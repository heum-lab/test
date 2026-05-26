'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgencyOptions, useSellerOptions } from '@/hooks/useOptions';
import { ITEM_STATUSES, PLACE_CATEGORIES } from '@/lib/constants';
import { placeSchema, type PlaceInput } from '@/lib/validations/place';
import { useSession } from '@/lib/auth/session-context';

type Props = {
  defaultValues?: Partial<PlaceInput>;
  onSubmit: (input: PlaceInput) => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

function diffDaysInclusive(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const ms = e.getTime() - s.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / 86_400_000) + 1;
}

export function PlaceForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = '저장',
}: Props) {
  const session = useSession();
  const lockAgency = session.role === 'agency' || session.role === 'seller';
  const lockSeller = session.role === 'seller';
  const presetAgencyId = lockAgency ? session.agencyId ?? undefined : undefined;
  const presetSellerId = lockSeller ? session.sellerId ?? undefined : undefined;

  const form = useForm<PlaceInput>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      status: '대기',
      ad_type: '',
      ...(presetAgencyId !== undefined ? { agency_id: presetAgencyId } : {}),
      ...(presetSellerId !== undefined ? { seller_id: presetSellerId } : {}),
      ...defaultValues,
    },
  });

  const agencyId = form.watch('agency_id');
  const { data: agencies = [] } = useAgencyOptions();
  const { data: sellers = [] } = useSellerOptions(agencyId);

  const dailyTraffic = form.watch('traffic_count') ?? 0;
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');
  const days = diffDaysInclusive(startDate, endDate);
  const totalTraffic = Number(dailyTraffic || 0) * days;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="총판 *" error={form.formState.errors.agency_id?.message}>
          <Select
            value={agencyId ? String(agencyId) : ''}
            onValueChange={(v) => {
              form.setValue('agency_id', Number(v));
              if (!lockSeller) form.setValue('seller_id', 0 as unknown as number);
            }}
            disabled={lockAgency}
          >
            <SelectTrigger>
              <SelectValue placeholder="총판 선택" />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="대행사 *" error={form.formState.errors.seller_id?.message}>
          <Select
            value={form.watch('seller_id') ? String(form.watch('seller_id')) : ''}
            onValueChange={(v) => form.setValue('seller_id', Number(v))}
            disabled={lockSeller}
          >
            <SelectTrigger>
              <SelectValue placeholder="대행사 선택" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name} ({s.seller_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="상점명 *" error={form.formState.errors.store_name?.message}>
          <Input {...form.register('store_name')} />
        </Field>
        <Field label="메인 키워드 *" error={form.formState.errors.main_keyword?.message}>
          <Input {...form.register('main_keyword')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="업종 카테고리">
          <Select
            value={form.watch('category') ?? ''}
            onValueChange={(v) => form.setValue('category', v as (typeof PLACE_CATEGORIES)[number])}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {PLACE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="검색 키워드 *" error={form.formState.errors.search_keyword?.message}>
          <Input {...form.register('search_keyword')} />
        </Field>
      </div>

      <Field label="플레이스 URL *" error={form.formState.errors.place_url?.message}>
        <Input {...form.register('place_url')} placeholder="https://m.place.naver.com/..." />
      </Field>

      <div className="grid grid-cols-4 gap-3">
        <Field label="주문일">
          <Input type="date" {...form.register('order_date')} />
        </Field>
        <Field label="시작일 *" error={form.formState.errors.start_date?.message}>
          <Input type="date" {...form.register('start_date')} />
        </Field>
        <Field label="종료일 *" error={form.formState.errors.end_date?.message}>
          <Input type="date" {...form.register('end_date')} />
        </Field>
        <Field label="입금일">
          <Input type="date" {...form.register('payment_date')} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="일유입수량" error={form.formState.errors.traffic_count?.message}>
          <Input type="number" min={0} step={100} {...form.register('traffic_count')} />
        </Field>
        <Field label={`총 유입수량${days ? ` (${days}일)` : ''}`}>
          <Input value={totalTraffic.toLocaleString()} readOnly tabIndex={-1} />
        </Field>
        <Field label="상태">
          <Select
            value={form.watch('status') ?? '대기'}
            onValueChange={(v) => form.setValue('status', v as (typeof ITEM_STATUSES)[number])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="비고">
        <Textarea rows={2} {...form.register('memo')} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '저장 중...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}
