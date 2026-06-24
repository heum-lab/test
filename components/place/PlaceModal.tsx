'use client';

import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreatePlace, useUpdatePlace, type PlaceItem } from '@/hooks/usePlace';
import { PlaceForm } from './PlaceForm';
import type { PlaceInput } from '@/lib/validations/place';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PlaceItem | null;
};

export function PlaceModal({ open, onOpenChange, item }: Props) {
  const create = useCreatePlace();
  const update = useUpdatePlace();
  const isEdit = !!item;

  const handleSubmit = (input: PlaceInput) => {
    if (isEdit && item) {
      update.mutate(
        { id: item.id, patch: input },
        {
          onSuccess: () => {
            toast.success('수정되었습니다.');
            onOpenChange(false);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.success('등록되었습니다.');
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>플레이스 {isEdit ? '수정' : '등록'}</DialogTitle>
          <DialogDescription>
            총판/대행사를 선택하고 필수 항목(*)을 입력해 주세요.
          </DialogDescription>
        </DialogHeader>
        <PlaceForm
          defaultValues={
            item
              ? {
                  ...item,
                  agency_id: item.agency_id ?? undefined,
                  seller_id: item.seller_id ?? undefined,
                  category: (item.category as PlaceInput['category']) ?? undefined,
                  logic: (item.logic as PlaceInput['logic']) ?? undefined,
                  ad_type: item.ad_type as PlaceInput['ad_type'],
                  traffic_count: item.traffic_count ?? undefined,
                  payment_amount: item.payment_amount ?? undefined,
                  order_date: item.order_date ?? undefined,
                  payment_date: item.payment_date ?? undefined,
                  memo: item.memo ?? undefined,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={create.isPending || update.isPending}
          submitLabel={isEdit ? '수정' : '등록'}
        />
      </DialogContent>
    </Dialog>
  );
}
