'use client';

import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateBlog, useUpdateBlog, type BlogItem } from '@/hooks/useBlog';
import { BlogForm } from './BlogForm';
import type { BlogInput } from '@/lib/validations/blog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: BlogItem | null;
};

export function BlogModal({ open, onOpenChange, item }: Props) {
  const create = useCreateBlog();
  const update = useUpdateBlog();
  const isEdit = !!item;

  const handleSubmit = (input: BlogInput) => {
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
          <DialogTitle>블로그 {isEdit ? '수정' : '등록'}</DialogTitle>
          <DialogDescription>필수 항목(*)을 입력해 주세요.</DialogDescription>
        </DialogHeader>
        <BlogForm
          defaultValues={
            item
              ? {
                  ...item,
                  agency_id: item.agency_id ?? undefined,
                  seller_id: item.seller_id ?? undefined,
                  ad_type: item.ad_type as BlogInput['ad_type'],
                  search_keyword: item.search_keyword ?? undefined,
                  content_url: item.content_url ?? undefined,
                  store_url: item.store_url ?? undefined,
                  order_date: item.order_date ?? undefined,
                  payment_date: item.payment_date ?? undefined,
                  memo: item.memo ?? undefined,
                  attachment_path: item.attachment_path,
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
