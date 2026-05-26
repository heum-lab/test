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
import { FileUploader } from '@/components/common/FileUploader';
import { useAgencyOptions, useSellerOptions } from '@/hooks/useOptions';
import { BLOG_AD_TYPES, BLOG_STATUSES } from '@/lib/constants';
import { blogSchema, type BlogInput } from '@/lib/validations/blog';
import { useSession } from '@/lib/auth/session-context';

type Props = {
  defaultValues?: Partial<BlogInput>;
  onSubmit: (input: BlogInput) => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function BlogForm({
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

  const form = useForm<BlogInput>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      status: '대기',
      daily_publish_count: 0,
      total_publish_count: 0,
      ...(presetAgencyId !== undefined ? { agency_id: presetAgencyId } : {}),
      ...(presetSellerId !== undefined ? { seller_id: presetSellerId } : {}),
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
        <Field label="플레이스명 *" error={form.formState.errors.place_name?.message}>
          <Input {...form.register('place_name')} />
        </Field>
        <Field label="메인 키워드 *" error={form.formState.errors.main_keyword?.message}>
          <Input {...form.register('main_keyword')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="광고 타입 *" error={form.formState.errors.ad_type?.message}>
          <Select
            value={form.watch('ad_type') ?? ''}
            onValueChange={(v) => form.setValue('ad_type', v as (typeof BLOG_AD_TYPES)[number])}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {BLOG_AD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="검색 키워드">
          <Input {...form.register('search_keyword')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="URL 주소" error={form.formState.errors.content_url?.message}>
          <Input {...form.register('content_url')} placeholder="https://" />
        </Field>
        <Field label="상점 주소" error={form.formState.errors.store_url?.message}>
          <Input {...form.register('store_url')} placeholder="https://" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="일 발행건수 *" error={form.formState.errors.daily_publish_count?.message}>
          <Input type="number" min={0} {...form.register('daily_publish_count')} />
        </Field>
        <Field label="총 발행건수 *" error={form.formState.errors.total_publish_count?.message}>
          <Input type="number" min={0} {...form.register('total_publish_count')} />
        </Field>
      </div>

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

      <div className="grid grid-cols-2 gap-3">
        <Field label="상태">
          <Select
            value={form.watch('status') ?? '대기'}
            onValueChange={(v) => form.setValue('status', v as (typeof BLOG_STATUSES)[number])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOG_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="첨부파일">
          <FileUploader
            value={form.watch('attachment_path')}
            onChange={(path) => form.setValue('attachment_path', path)}
          />
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
