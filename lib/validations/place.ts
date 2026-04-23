import { z } from 'zod';
import { ITEM_STATUSES, PLACE_CATEGORIES } from '@/lib/constants';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const placeSchema = z.object({
  agency_id: z.coerce.number().int().positive('총판를 선택해 주세요.'),
  seller_id: z.coerce.number().int().positive('대행사를 선택해 주세요.'),
  store_name: z.string().trim().min(1, '상점명을 입력해 주세요.'),
  main_keyword: z.string().trim().min(1, '메인 키워드를 입력해 주세요.'),
  ad_type: z
    .string()
    .optional()
    .transform((v) => v ?? ''),
  search_keyword: z.string().trim().min(1, '검색 키워드를 입력해 주세요.'),
  category: z.enum(PLACE_CATEGORIES).optional(),
  place_url: z
    .string()
    .trim()
    .min(1, '플레이스 URL을 입력해 주세요.')
    .regex(/^https?:\/\//, 'http(s) URL 이어야 합니다.'),
  traffic_count: z.coerce
    .number()
    .int()
    .min(0)
    .refine((v) => v % 100 === 0, { message: '일유입수량은 100 단위로 입력해 주세요.' })
    .optional(),
  payment_amount: z.coerce.number().int().min(0).optional(),
  order_date: optionalDate,
  start_date: z.string().min(1, '시작일을 선택해 주세요.'),
  end_date: z.string().min(1, '종료일을 선택해 주세요.'),
  payment_date: optionalDate,
  status: z.enum(ITEM_STATUSES).default('대기'),
  memo: optionalText,
});

export type PlaceInput = z.infer<typeof placeSchema>;
