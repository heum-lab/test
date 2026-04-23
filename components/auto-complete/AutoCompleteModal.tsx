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
  useCreateAutoComplete,
  useUpdateAutoComplete,
  type AutoCompleteItem,
} from '@/hooks/useAutoComplete';
import { AutoCompleteForm } from './AutoCompleteForm';
import type { AutoCompleteInput } from '@/lib/validations/auto-complete';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: AutoCompleteItem | null;
};

export function AutoCompleteModal({ open, onOpenChange, item }: Props) {
  const create = useCreateAutoComplete();
  const update = useUpdateAutoComplete();
  const isEdit = !!item;

  const handleSubmit = (input: AutoCompleteInput) => {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>자동완성 {isEdit ? '수정' : '등록'}</DialogTitle>
          <DialogDescription>
            자동완성 키워드와 보장 기간을 설정합니다.
          </DialogDescription>
        </DialogHeader>
        <AutoCompleteForm
          defaultValues={
            item
              ? {
                  ...item,
                  agency_id: item.agency_id ?? undefined,
                  seller_id: item.seller_id ?? undefined,
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
