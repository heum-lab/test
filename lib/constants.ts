export const USER_ROLES = ['super_admin', 'agency', 'seller'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '슈퍼 관리자',
  agency: '총판',
  seller: '대행사',
};

export const ITEM_STATUSES = [
  '대기',
  '작업중',
  '중지',
  '환불요청',
  '환불완료',
  '연장처리',
  '작업완료',
  '삭제요청',
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const BLOG_STATUSES = ['대기', '작업중', '작업완료'] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const PAGE_SIZE_OPTIONS = [50, 70, 100, 130, 150] as const;
export const DEFAULT_PAGE_SIZE = 50;

// 네이버쇼핑
export const NAVER_SHOPPING_AD_TYPES = ['통검', '쇼검', '통+쇼검'] as const;

export const NAVER_SHOPPING_LANDINGS = [
  '플러스스토어',
  '기타유입',
  '기타유입L',
  '원픽플러스',
  '팝콘',
  '팝핀',
] as const;

// 플레이스
export const PLACE_AD_TYPES = [
  '버즈빌',
  '통합매체',
  '블로그저장',
  '길찾기',
  '기타유입',
  '맛집 리워드',
  '오른플러스',
  '일키플',
  '플레이스순',
  '플레이스원',
  '플레이스플러스',
  '플레이스탑',
  '플레이스팝',
  '플레이스맥스',
  '플레이스프리미엄',
  '플레이스베이직',
  '플레이스라이트',
  '플레이스스탠다드',
  '플레이스프로',
  '플레이스엔터프라이즈',
  '리뷰저장',
  '리뷰작성',
  '공유저장',
  '공유작성',
  '네이버톡톡',
  '네이버지도',
  '카카오지도',
  '구글지도',
  '기타',
] as const;

export const PLACE_CATEGORIES = [
  '카페',
  '식당',
  '미용실',
  '네일샵',
  '숙박',
  '병원·피부',
  '기타',
] as const;

// 플레이스/카카오맵 작업 로직
export const PLACE_LOGICS = ['로직1번', '로직2번'] as const;
export type PlaceLogic = (typeof PLACE_LOGICS)[number];

// 블로그 (Phase 3)
export const BLOG_AD_TYPES = [
  '정보성',
  '후기성',
  '후기성2',
  '후기성3',
  '후기성4',
  '비실명',
  '비실명P',
  '20-24배포',
  '22-24R',
  '247',
  '준최배포2',
  '247ai기자단',
  '순위247',
  '247-S',
  '영상블',
  '신생블',
  '이미지생성형 실계',
] as const;

// 간편 조회 날짜 옵션
export const QUICK_DATE_OPTIONS = [
  { key: 'today', label: '오늘' },
  { key: 'yesterday', label: '어제' },
  { key: 'last7', label: '7일전' },
  { key: 'last1m', label: '1개월' },
  { key: 'last3m', label: '3개월' },
  { key: 'last6m', label: '6개월' },
  { key: 'last12m', label: '12개월' },
  { key: 'thisMonth', label: '이번달' },
  { key: 'lastMonth', label: '이전달' },
] as const;
export type QuickDateKey = (typeof QUICK_DATE_OPTIONS)[number]['key'];

export const DATE_TYPE_OPTIONS = [
  { value: 'start_date', label: '시작일' },
  { value: 'end_date', label: '종료일' },
  { value: 'order_date', label: '주문일' },
  { value: 'payment_date', label: '입금일' },
] as const;
export type DateType = (typeof DATE_TYPE_OPTIONS)[number]['value'];
