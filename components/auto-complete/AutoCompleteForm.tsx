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
import { ITEM_STATUSES } from '@/lib/constants';
import { autoCompleteSchema, type AutoCompleteInput } from '@/lib/validations/auto-complete';

type Props = {
  defaultValues?: Partial<AutoCompleteInput>;
  onSubmit: (input: AutoCompleteInput) => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function AutoCompleteForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = '저장',
}: Props) {
  const form = useForm<AutoCompleteInput>({
    resolver: zodResolver(autoCompleteSchema),
    defaultValues: {
      status: '대기',
      ...defaultValues,
    },
  });

  const agencyId = form.watch('agency_id');
  const { data: agencies = [] } = useAgencyOptions();
  const { data: sellers = [] } = useSellerOptions(agencyId);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="총판 *" error={form.formState.errors.agency_id?.message}>
          <Select
            value={agencyId ? String(agencyId) : ''}
            onValueChange={(v) => {
              form.setValue('agency_id', Number(v));
              form.setValue('seller_id', 0 as unknown as number);
            }}
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

      <Field label="키워드 *" error={form.formState.errors.keyword?.message}>
        <Input {...form.register('keyword')} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="노출시작일 *" error={form.formState.errors.expose_start_date?.message}>
          <Input type="date" {...form.register('expose_start_date')} />
        </Field>
        <Field label="보장종료일 *" error={form.formState.errors.guarantee_end_date?.message}>
          <Input type="date" {...form.register('guarantee_end_date')} />
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
