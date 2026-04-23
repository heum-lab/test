import { z } from 'zod';

export const agencyCreateSchema = z.object({
  name: z.string().trim().min(2, '총판명은 2자 이상이어야 합니다.'),
  username: z
    .string()
    .trim()
    .min(4, '아이디는 4자 이상이어야 합니다.')
    .regex(/^[A-Za-z0-9_]+$/, '영문/숫자/_ 만 사용할 수 있습니다.'),
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(/[A-Za-z]/, '영문을 포함해야 합니다.')
    .regex(/[0-9]/, '숫자를 포함해야 합니다.'),
  phone: z.string().regex(/^[0-9-]{9,14}$/, '올바른 전화번호 형식이 아닙니다.'),
  memo: z.string().optional().or(z.literal('')),
  is_approved: z.boolean().default(true),
});

export type AgencyCreateInput = z.infer<typeof agencyCreateSchema>;
