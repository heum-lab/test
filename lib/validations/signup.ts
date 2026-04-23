import { z } from 'zod';

const basePasswordRule = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .regex(/[A-Za-z]/, '영문을 포함해야 합니다.')
  .regex(/[0-9]/, '숫자를 포함해야 합니다.');

const baseFields = {
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: basePasswordRule,
  passwordConfirm: z.string(),
  name: z.string().trim().min(2, '이름은 2자 이상이어야 합니다.'),
  username: z
    .string()
    .trim()
    .min(4, '아이디는 4자 이상이어야 합니다.')
    .regex(/^[A-Za-z0-9_]+$/, '영문/숫자/_ 만 사용할 수 있습니다.'),
  phone: z.string().regex(/^[0-9-]{9,14}$/, '올바른 전화번호 형식이 아닙니다.'),
  memo: z.string().optional(),
};

export const agencySignupSchema = z
  .object({
    ...baseFields,
    role: z.literal('agency'),
    agency_name: z.string().trim().min(1, '총판명을 입력해 주세요.'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export const sellerSignupSchema = z
  .object({
    ...baseFields,
    role: z.literal('seller'),
    agency_id: z.coerce.number().int().positive('소속 총판를 선택해 주세요.'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type AgencySignupInput = z.infer<typeof agencySignupSchema>;
export type SellerSignupInput = z.infer<typeof sellerSignupSchema>;
