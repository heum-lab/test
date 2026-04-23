import { naverShoppingSchema } from './naver-shopping';

// 오늘의집은 네이버쇼핑과 동일 구조 (ARCHITECTURE.md 3.7)
export const ohouseSchema = naverShoppingSchema;
export type OhouseInput = import('zod').infer<typeof ohouseSchema>;
