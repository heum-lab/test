import { z } from 'zod';
import { BLOG_AD_TYPES, BLOG_STATUSES } from '@/lib/constants';

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

export const blogSchema = z.object({
  agency_id: z.coerce.number().int().positive('총판를 선택해 주세요.'),
  seller_id: z.coerce.number().int().positive('대행사를 선택해 주세요.'),
  place_name: z.string().trim().min(1, '플레이스명을 입력해 주세요.'),
  main_keyword: z.string().trim().min(1, '메인 키워드를 입력해 주세요.'),
  ad_type: z.enum(BLOG_AD_TYPES, { message: '광고 타입을 선택해 주세요.' }),
  search_keyword: optionalText,
  content_url: optionalUrl,
  store_url: optionalUrl,
  daily_publish_count: z.coerce
    .number()
    .int()
    .min(0, '0 이상이어야 합니다.')
    .default(0),
  total_publish_count: z.coerce
    .number()
    .int()
    .min(0, '0 이상이어야 합니다.')
    .default(0),
  attachment_path: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  order_date: optionalDate,
  start_date: z.string().min(1, '시작일을 선택해 주세요.'),
  end_date: z.string().min(1, '종료일을 선택해 주세요.'),
  payment_date: optionalDate,
  status: z.enum(BLOG_STATUSES).default('대기'),
  memo: optionalText,
});

export type BlogInput = z.infer<typeof blogSchema>;
