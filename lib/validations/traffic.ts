import { naverShoppingSchema } from './naver-shopping';

// 유입플은 네이버쇼핑과 동일 구조 (ARCHITECTURE.md 3.7)
export const trafficSchema = naverShoppingSchema;
export type TrafficInput = import('zod').infer<typeof trafficSchema>;
