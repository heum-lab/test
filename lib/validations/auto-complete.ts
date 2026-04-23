import { z } from 'zod';
import { ITEM_STATUSES } from '@/lib/constants';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const autoCompleteSchema = z
  .object({
    agency_id: z.coerce.number().int().positive('총판를 선택해 주세요.'),
    seller_id: z.coerce.number().int().positive('대행사를 선택해 주세요.'),
    keyword: z.string().trim().min(1, '키워드를 입력해 주세요.'),
    expose_start_date: z.string().min(1, '노출시작일을 선택해 주세요.'),
    guarantee_end_date: z.string().min(1, '보장종료일을 선택해 주세요.'),
    status: z.enum(ITEM_STATUSES).default('대기'),
    memo: optionalText,
  })
  .refine((data) => data.expose_start_date <= data.guarantee_end_date, {
    message: '보장종료일은 노출시작일 이후여야 합니다.',
    path: ['guarantee_end_date'],
  });

export type AutoCompleteInput = z.infer<typeof autoCompleteSchema>;
