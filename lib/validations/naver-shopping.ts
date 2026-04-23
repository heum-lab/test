import { z } from 'zod';
import {
  ITEM_STATUSES,
  NAVER_SHOPPING_AD_TYPES,
  NAVER_SHOPPING_LANDINGS,
} from '@/lib/constants';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v))
  .refine((v) => !v || /^https?:\/\//.test(v), 'http(s) URL 이어야 합니다.');

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const naverShoppingSchema = z.object({
  agency_id: z.coerce.number().int().positive('총판를 선택해 주세요.'),
  seller_id: z.coerce.number().int().positive('대행사를 선택해 주세요.'),
  keyword: z.string().trim().min(1, '키워드를 입력해 주세요.'),
  sub_keyword1: optionalText,
  sub_keyword2: optionalText,
  product_mid: z.string().trim().min(1, '상품 MID를 입력해 주세요.'),
  product_url: optionalUrl,
  price_compare_mid: optionalText,
  price_compare_url: optionalUrl,
  ad_type: z.enum(NAVER_SHOPPING_AD_TYPES).optional(),
  landing_type: z.enum(NAVER_SHOPPING_LANDINGS).optional(),
  traffic_count: z.coerce.number().int().min(0).optional(),
  order_date: optionalDate,
  start_date: z.string().min(1, '시작일을 선택해 주세요.'),
  end_date: z.string().min(1, '종료일을 선택해 주세요.'),
  payment_date: optionalDate,
  status: z.enum(ITEM_STATUSES).default('대기'),
  memo: optionalText,
});

export type NaverShoppingInput = z.infer<typeof naverShoppingSchema>;
