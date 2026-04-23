'use client';

import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useCreateNaverShopping,
  useUpdateNaverShopping,
  type NaverShoppingItem,
} from '@/hooks/useNaverShopping';
import { NaverShoppingForm } from './NaverShoppingForm';
import type { NaverShoppingInput } from '@/lib/validations/naver-shopping';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: NaverShoppingItem | null;
};

export function NaverShoppingModal({ open, onOpenChange, item }: Props) {
  const create = useCreateNaverShopping();
  const update = useUpdateNaverShopping();
  const isEdit = !!item;

  const handleSubmit = (input: NaverShoppingInput) => {
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
          <DialogTitle>네이버쇼핑 {isEdit ? '수정' : '등록'}</DialogTitle>
          <DialogDescription>
            총판/대행사를 선택하고 필수 항목(*)을 입력해 주세요.
          </DialogDescription>
        </DialogHeader>
        <NaverShoppingForm
          defaultValues={
            item
              ? {
                  ...item,
                  agency_id: item.agency_id ?? undefined,
                  seller_id: item.seller_id ?? undefined,
                  sub_keyword1: item.sub_keyword1 ?? undefined,
                  sub_keyword2: item.sub_keyword2 ?? undefined,
                  product_url: item.product_url ?? undefined,
                  price_compare_mid: item.price_compare_mid ?? undefined,
                  price_compare_url: item.price_compare_url ?? undefined,
                  ad_type: (item.ad_type as NaverShoppingInput['ad_type']) ?? undefined,
                  landing_type:
                    (item.landing_type as NaverShoppingInput['landing_type']) ?? undefined,
                  traffic_count: item.traffic_count ?? undefined,
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
