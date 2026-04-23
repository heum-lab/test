# ARCHITECTURE.md — 시스템 아키텍처

## 1. 전체 아키텍처 개요

```
┌─────────────────────────────────────────────┐
│              Browser (Admin User)            │
└──────────────────────┬──────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────┐
│           Next.js App (Vercel)               │
│                                             │
│  ┌─────────────┐    ┌─────────────────────┐ │
│  │ App Router  │    │   Route Handlers    │ │
│  │ (RSC + CC)  │    │   /api/**           │ │
│  └──────┬──────┘    └──────────┬──────────┘ │
│         │                      │            │
└─────────┼──────────────────────┼────────────┘
          │                      │
┌─────────▼──────────────────────▼────────────┐
│                 Supabase                     │
│                                             │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │PostgreSQL │  │   Auth   │  │ Storage  │ │
│  │  (RLS)    │  │  (JWT)   │  │ (Files)  │ │
│  └───────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────┘
```

---

## 2. 인증 아키텍처

```
로그인 요청
    │
    ▼
Supabase Auth (이메일/비밀번호)
    │
    ▼
JWT 발급 → Supabase Session Cookie 저장
    │
    ▼
Next.js Middleware (middleware.ts)
    ├── 비인증 → /login 리다이렉트
    └── 인증 → Role 확인 → 접근 허용/거부
```

### Role 기반 접근 제어 (RLS + Middleware)

| Role | 접근 가능 경로 |
|------|--------------|
| super_admin | 전체 |
| agency | /admin/** (대행사 관리 제외) |
| seller | /admin/** (본인 데이터만 조회) |

---

## 3. 데이터베이스 스키마 (Supabase PostgreSQL)

### 3.1 profiles (auth 확장)

```sql
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('super_admin', 'agency', 'seller')),
  agency_id   INTEGER REFERENCES agencies(id),
  seller_id   INTEGER REFERENCES sellers(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 agencies (대행사)

```sql
CREATE TABLE agencies (
  id            SERIAL PRIMARY KEY,
  parent_name   TEXT NOT NULL,           -- 총판명 (굿투그레이트-두2)
  name          TEXT NOT NULL,           -- 대행사명 (앤올마케팅)
  username      TEXT UNIQUE NOT NULL,    -- 아이디
  phone         TEXT,
  email         TEXT,
  memo          TEXT,
  is_approved   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 sellers (셀러)

```sql
CREATE TABLE sellers (
  id          SERIAL PRIMARY KEY,
  seller_code INTEGER UNIQUE NOT NULL,   -- 셀러코드 (35452 등)
  parent_name TEXT NOT NULL,
  agency_id   INTEGER REFERENCES agencies(id),
  name        TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  phone       TEXT,
  email       TEXT,
  memo        TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 naver_shopping_items (네이버쇼핑)

```sql
CREATE TABLE naver_shopping_items (
  id                SERIAL PRIMARY KEY,
  agency_id         INTEGER REFERENCES agencies(id),
  seller_id         INTEGER REFERENCES sellers(id),
  keyword           TEXT NOT NULL,
  sub_keyword1      TEXT,
  sub_keyword2      TEXT,
  product_mid       TEXT NOT NULL,
  product_url       TEXT,
  price_compare_mid TEXT,
  price_compare_url TEXT,
  ad_type           TEXT,                -- 통검/쇼검/통+쇼검
  landing_type      TEXT,                -- 원픽플러스/팝콘/팝핀 등
  traffic_count     INTEGER,
  order_date        DATE,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  refund_date       DATE,
  payment_date      DATE,
  status            TEXT NOT NULL DEFAULT '대기'
                    CHECK (status IN ('대기','작업중','중지','환불요청','환불완료','연장처리','작업완료','삭제요청')),
  initial_rank      INTEGER,
  current_rank      INTEGER,
  yesterday_rank    INTEGER,
  memo              TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_naver_shopping_filter
  ON naver_shopping_items (seller_id, status, start_date DESC);
```

### 3.5 place_items (네이버 플레이스)

```sql
CREATE TABLE place_items (
  id              SERIAL PRIMARY KEY,
  agency_id       INTEGER REFERENCES agencies(id),
  seller_id       INTEGER REFERENCES sellers(id),
  store_name      TEXT NOT NULL,
  main_keyword    TEXT NOT NULL,
  ad_type         TEXT NOT NULL,         -- 버즈빌/통합매체/맛집 리워드 등
  search_keyword  TEXT NOT NULL,
  category        TEXT,                  -- 카페/식당/미용실/네일샵/숙박/병원·피부/기타
  place_url       TEXT NOT NULL,
  traffic_count   INTEGER,
  payment_amount  INTEGER,
  order_date      DATE,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  refund_date     DATE,
  payment_date    DATE,
  status          TEXT NOT NULL DEFAULT '대기'
                  CHECK (status IN ('대기','작업중','중지','환불요청','환불완료','연장처리','작업완료','삭제요청')),
  initial_rank    INTEGER,
  current_rank    INTEGER,
  yesterday_rank  INTEGER,
  memo            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6 blog_items (블로그)

```sql
CREATE TABLE blog_items (
  id                  SERIAL PRIMARY KEY,
  agency_id           INTEGER REFERENCES agencies(id),
  seller_id           INTEGER REFERENCES sellers(id),
  place_name          TEXT NOT NULL,
  main_keyword        TEXT NOT NULL,
  ad_type             TEXT NOT NULL,     -- 정보성/후기성/비실명/247ai기자단 등
  search_keyword      TEXT,
  content_url         TEXT,
  store_url           TEXT,
  daily_publish_count INTEGER NOT NULL,
  total_publish_count INTEGER NOT NULL,
  attachment_path     TEXT,              -- Supabase Storage 경로
  order_date          DATE,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  payment_date        DATE,
  status              TEXT NOT NULL DEFAULT '대기'
                      CHECK (status IN ('대기','작업중','작업완료')),
  initial_rank        INTEGER,
  current_rank        INTEGER,
  yesterday_rank      INTEGER,
  memo                TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7 traffic_items / ohouse_items / kakao_map_items

- `traffic_items`: naver_shopping_items와 동일 구조
- `ohouse_items`: naver_shopping_items와 동일 구조
- `kakao_map_items`: place_items와 동일 구조

### 3.8 auto_complete_items (자동완성)

```sql
CREATE TABLE auto_complete_items (
  id                  SERIAL PRIMARY KEY,
  agency_id           INTEGER REFERENCES agencies(id),
  seller_id           INTEGER REFERENCES sellers(id),
  keyword             TEXT NOT NULL,
  expose_start_date   DATE NOT NULL,     -- 노출시작일
  guarantee_end_date  DATE NOT NULL,     -- 보장종료일
  status              TEXT NOT NULL DEFAULT '대기',
  memo                TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. API 설계 (Route Handlers)

### 4.1 공통 응답 형식

```typescript
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  total?: number;   // 목록 조회 시 전체 건수
};
```

### 4.2 엔드포인트 목록

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/naver-shopping | 목록 조회 |
| POST | /api/naver-shopping | 단건 등록 |
| PATCH | /api/naver-shopping/[id] | 단건 수정 |
| PATCH | /api/naver-shopping/bulk | 일괄 상태 변경 |
| POST | /api/naver-shopping/excel-upload | 엑셀 대량 등록 |
| GET | /api/naver-shopping/excel-download | 엑셀 다운로드 |
| GET | /api/place | 플레이스 목록 |
| POST | /api/place | 등록 |
| PATCH | /api/place/[id] | 수정 |
| PATCH | /api/place/bulk | 일괄 처리 |
| GET | /api/blog | 블로그 목록 |
| POST | /api/blog | 등록 |
| POST | /api/blog/excel-upload | 엑셀 대량 등록 |
| GET | /api/traffic | 유입플 목록 |
| POST | /api/traffic | 등록 |
| GET | /api/ohouse | 오늘의집 목록 |
| GET | /api/kakao-map | 카카오맵 목록 |
| GET | /api/auto-complete | 자동완성 목록 |
| GET | /api/agencies | 대행사 목록 |
| POST | /api/agencies | 등록 |
| PATCH | /api/agencies/[id] | 수정 |
| GET | /api/sellers | 셀러 목록 |
| POST | /api/sellers | 등록 |
| PATCH | /api/sellers/[id] | 수정 |
| GET | /api/sellers/by-agency/[agencyId] | 대행사별 셀러 (드롭다운용) |

### 4.3 공통 쿼리 파라미터

```
GET /api/naver-shopping?
  agency_id=1
  &seller_id=7
  &status=작업중
  &date_type=start_date        # start_date | end_date | order_date | payment_date
  &start=2026-04-01
  &end=2026-04-30
  &search_type=keyword         # keyword | seller_name | product_mid
  &search_value=화환
  &page=1
  &page_size=50
  &sort=start_date
  &sort_dir=desc
```

---

## 5. 주요 컴포넌트 흐름

### 5.1 목록 페이지 흐름

```
page.tsx (Server Component)
  └── 초기 데이터 prefetch (Supabase Server Client)
        │
        ▼
  NaverShoppingPage (Client Component)
    ├── SearchFilter       ← URL searchParams 동기화
    ├── BulkActionBar      ← 선택 항목 일괄 처리
    ├── NaverShoppingTable
    │   ├── DataTable (공통)
    │   └── Row별 관리 버튼 → NaverShoppingModal
    └── Pagination
```

### 5.2 엑셀 업로드 흐름

```
ExcelUploader
  → .xlsx 파일 선택
  → SheetJS로 파싱 (브라우저)
  → Zod 스키마 유효성 검사
  → POST /api/{module}/excel-upload
  → Supabase bulk insert (배치 100건)
  → 결과 토스트 (성공 N건 / 실패 M건)
```

### 5.3 상태 변경 흐름

```
BulkActionBar → 버튼 클릭
  → ConfirmDialog (확인)
  → PATCH /api/{module}/bulk
    body: { ids: number[], status: string, extend_days?: number }
  → Supabase update
  → TanStack Query invalidate
  → 테이블 자동 갱신
```

---

## 6. 환경 변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx        # 서버 전용 (Route Handler)
```

---

## 7. 배포 구성

| 구성요소 | 서비스 |
|----------|--------|
| 프론트엔드 + API | Vercel |
| 데이터베이스 | Supabase (PostgreSQL) |
| 파일 스토리지 | Supabase Storage |
| 인증 | Supabase Auth |
| CI/CD | GitHub Actions → Vercel 자동 배포 |

---

## 8. Row Level Security (RLS) 정책

```sql
-- 예시: naver_shopping_items (다른 테이블 동일 패턴 적용)
ALTER TABLE naver_shopping_items ENABLE ROW LEVEL SECURITY;

-- super_admin: 전체 접근
CREATE POLICY "super_admin_all" ON naver_shopping_items
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- agency: 소속 셀러 데이터만
CREATE POLICY "agency_own" ON naver_shopping_items
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM sellers
      WHERE agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
  );

-- seller: 본인 데이터만
CREATE POLICY "seller_own" ON naver_shopping_items
  FOR ALL USING (
    seller_id = (SELECT seller_id FROM profiles WHERE id = auth.uid())
  );
```

---

## 9. 성능 최적화 전략

- **복합 인덱스:** `(seller_id, status, start_date)` 로 주요 필터 쿼리 최적화
- **페이지네이션:** Supabase `.range(from, to)` 활용 (오프셋 방식)
- **TanStack Query 캐싱:** staleTime 60초, 필터 변경 시 자동 refetch
- **엑셀 배치:** 한 번에 100건씩 insert하여 타임아웃 방지
- **낙관적 업데이트:** 상태 변경 시 UI 선반영 후 서버 동기화
