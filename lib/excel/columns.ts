/**
 * 모듈별 엑셀 컬럼 매핑.
 * 총판/대행사는 업로드 시 사용자가 사전 선택하므로 엑셀에 포함되지 않습니다.
 */

export type ExcelColumn = {
  header: string;
  field: string;
  type?: 'text' | 'number' | 'date' | 'status';
  required?: boolean;
};

export type ModuleKey =
  | 'naver-shopping'
  | 'place'
  | 'blog'
  | 'traffic'
  | 'ohouse'
  | 'kakao-map'
  | 'auto-complete';

const NAVER_SHOPPING_COLUMNS: ExcelColumn[] = [
  { header: '키워드', field: 'keyword', required: true },
  { header: '서브키워드1', field: 'sub_keyword1' },
  { header: '서브키워드2', field: 'sub_keyword2' },
  { header: '상품MID', field: 'product_mid', required: true },
  { header: '상품URL', field: 'product_url' },
  { header: '가격비교MID', field: 'price_compare_mid' },
  { header: '가격비교URL', field: 'price_compare_url' },
  { header: '광고상품타입', field: 'ad_type' },
  { header: '랜딩페이지', field: 'landing_type' },
  { header: '유입수', field: 'traffic_count', type: 'number' },
  { header: '주문일', field: 'order_date', type: 'date' },
  { header: '시작일', field: 'start_date', type: 'date', required: true },
  { header: '종료일', field: 'end_date', type: 'date', required: true },
  { header: '입금일', field: 'payment_date', type: 'date' },
  { header: '상태', field: 'status', type: 'status' },
  { header: '비고', field: 'memo' },
];

const PLACE_COLUMNS: ExcelColumn[] = [
  { header: '상점명', field: 'store_name', required: true },
  { header: '메인키워드', field: 'main_keyword', required: true },
  { header: '광고상품타입', field: 'ad_type', required: true },
  { header: '검색키워드', field: 'search_keyword', required: true },
  { header: '카테고리', field: 'category' },
  { header: '로직', field: 'logic', required: true },
  { header: '플레이스URL', field: 'place_url', required: true },
  { header: '유입수', field: 'traffic_count', type: 'number' },
  { header: '입금액', field: 'payment_amount', type: 'number' },
  { header: '주문일', field: 'order_date', type: 'date' },
  { header: '시작일', field: 'start_date', type: 'date', required: true },
  { header: '종료일', field: 'end_date', type: 'date', required: true },
  { header: '입금일', field: 'payment_date', type: 'date' },
  { header: '상태', field: 'status', type: 'status' },
  { header: '비고', field: 'memo' },
];

const BLOG_COLUMNS: ExcelColumn[] = [
  { header: '플레이스명', field: 'place_name', required: true },
  { header: '메인키워드', field: 'main_keyword', required: true },
  { header: '광고타입', field: 'ad_type', required: true },
  { header: '검색키워드', field: 'search_keyword' },
  { header: 'URL주소', field: 'content_url' },
  { header: '상점주소', field: 'store_url' },
  { header: '일발행건수', field: 'daily_publish_count', type: 'number', required: true },
  { header: '총발행건수', field: 'total_publish_count', type: 'number', required: true },
  { header: '주문일', field: 'order_date', type: 'date' },
  { header: '시작일', field: 'start_date', type: 'date', required: true },
  { header: '종료일', field: 'end_date', type: 'date', required: true },
  { header: '입금일', field: 'payment_date', type: 'date' },
  { header: '상태', field: 'status', type: 'status' },
  { header: '비고', field: 'memo' },
];

const AUTO_COMPLETE_COLUMNS: ExcelColumn[] = [
  { header: '키워드', field: 'keyword', required: true },
  { header: '노출시작일', field: 'expose_start_date', type: 'date', required: true },
  { header: '보장종료일', field: 'guarantee_end_date', type: 'date', required: true },
  { header: '상태', field: 'status', type: 'status' },
  { header: '비고', field: 'memo' },
];

export const EXCEL_COLUMNS: Record<ModuleKey, ExcelColumn[]> = {
  'naver-shopping': NAVER_SHOPPING_COLUMNS,
  traffic: NAVER_SHOPPING_COLUMNS,
  ohouse: NAVER_SHOPPING_COLUMNS,
  place: PLACE_COLUMNS,
  'kakao-map': PLACE_COLUMNS,
  blog: BLOG_COLUMNS,
  'auto-complete': AUTO_COMPLETE_COLUMNS,
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  'naver-shopping': '네이버쇼핑',
  place: '플레이스',
  blog: '블로그',
  traffic: '유입플',
  ohouse: '오늘의집',
  'kakao-map': '카카오맵',
  'auto-complete': '자동완성',
};

export const MODULE_TABLES: Record<ModuleKey, string> = {
  'naver-shopping': 'naver_shopping_items',
  place: 'place_items',
  blog: 'blog_items',
  traffic: 'traffic_items',
  ohouse: 'ohouse_items',
  'kakao-map': 'kakao_map_items',
  'auto-complete': 'auto_complete_items',
};
