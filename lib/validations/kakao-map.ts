import { placeSchema } from './place';

// 카카오맵은 플레이스와 동일 구조 (ARCHITECTURE.md 3.7)
export const kakaoMapSchema = placeSchema;
export type KakaoMapInput = import('zod').infer<typeof kakaoMapSchema>;
