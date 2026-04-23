# ONEPICKACOUNT CRM

네이버·카카오 등 플랫폼의 검색 순위 대행 작업 통합 관리 어드민.

## 기술 스택

- Next.js 15 (App Router) + TypeScript 5 (strict)
- Tailwind CSS v4 + shadcn/ui 기반 컴포넌트
- Supabase (PostgreSQL + Auth + Storage)
- TanStack Query v5 + Zustand
- React Hook Form + Zod
- SheetJS, date-fns, sonner

## 설치 & 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local 에 Supabase URL / anon key / service role key 입력

# 3. Supabase 스키마 적용
# Supabase Studio → SQL Editor → supabase/migrations/0001_init_auth.sql 실행

# 4. 개발 서버
npm run dev
# → http://localhost:3000
```

## 초기 슈퍼 관리자 생성

슈퍼 관리자는 회원가입 플로우에서 만들 수 없습니다. Supabase 콘솔에서 직접 세팅합니다.

1. Authentication → Users → **Add user** 로 계정 생성 (비밀번호 포함)
2. SQL Editor 에서 해당 user_id 에 super_admin 프로필 생성:

```sql
INSERT INTO public.profiles (id, role)
VALUES ('<새로 만든 user_id>', 'super_admin');
```

3. 해당 계정으로 로그인 → `/admin/agency`, `/admin/seller` 접근 가능

## 회원가입 흐름

1. 방문자가 `/signup` 에서 **대행사** 또는 **셀러** 선택 후 정보 입력
2. `agencies` / `sellers` 테이블에 `is_approved=false` 상태로 저장
3. Supabase Auth 계정 생성 + `profiles` 레코드 자동 연결 (트리거)
4. 슈퍼 관리자가 `/admin/agency` 또는 `/admin/seller` 에서 **승인** 처리
5. 승인 후 로그인 가능

## 폴더 구조

`CONVENTIONS.md` 기준. 주요 경로:

```
app/
  (auth)/login, signup       # 인증 페이지 그룹
  (admin)/dashboard, agency, seller  # 어드민 페이지 그룹
  api/agencies, api/sellers  # Route Handlers
components/
  ui/           # shadcn/ui 기본 컴포넌트
  layout/       # Sidebar, Header, PageHeader
  agency/, seller/
hooks/          # TanStack Query 훅
lib/
  supabase/     # client, server, middleware
  validations/  # Zod 스키마
  utils.ts, constants.ts
types/          # 공통 타입, Supabase 타입
supabase/migrations/  # DB 마이그레이션 SQL
middleware.ts   # 인증 미들웨어
```

## 개발 스크립트

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 실행
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest
```

## 구현 상태

**Phase 1 완료**
- [x] 인증 (로그인/로그아웃/회원가입 + 승인 플로우)
- [x] 역할 기반 라우트 보호 (middleware)
- [x] 대행사 관리 (목록/승인/삭제)
- [x] 셀러 관리 (목록/승인/삭제)
- [x] 어드민 레이아웃 (사이드바/헤더)

**Phase 2 완료**
- [x] 공통 필터 컴포넌트 (대행사/셀러/상태/날짜타입/기간/검색/페이지크기)
- [x] 간편 날짜 선택 (오늘/어제/7일/1개월/3개월/6개월/12개월/이번달/이전달)
- [x] 일괄 처리 바 (설정 가능: 연장일수 / 상태 버튼)
- [x] 페이지네이션
- [x] 네이버쇼핑 — 목록/등록/수정/삭제/일괄처리 + 필터 + 페이징
- [x] 플레이스 — 목록/등록/수정/삭제/일괄처리 + 필터 + 페이징

**Phase 3 완료**
- [x] 블로그 — 목록/등록/수정/삭제/일괄처리 + 필터 + 페이징 + **첨부파일**
  - Supabase Storage 버킷 `blog-attachments` 사용
  - FileUploader 컴포넌트 (10MB 제한, 서명 URL 다운로드)
  - 상태 3종만 (대기/작업중/작업완료)
- [x] 유입플 — 네이버쇼핑과 동일 스키마로 구조 공유
  - traffic_items 테이블 (동일 컬럼)
  - NaverShoppingTable/Form 재사용

**Phase 4 완료**
- [x] 오늘의집 — 네이버쇼핑 구조 재사용 (ohouse_items)
- [x] 카카오맵 — 플레이스 구조 재사용 (kakao_map_items)
- [x] 자동완성 — 고유 구조 (노출시작일/보장종료일) + 전용 Form/Table/Filter
- [x] SearchFilter `searchPlaceholder` prop 확장

**Phase 5 완료 (엑셀)**
- [x] SheetJS 통합 + 모듈별 컬럼 매핑 (`lib/excel/columns.ts`)
- [x] 클라이언트 파싱/다운로드 유틸 (`lib/excel/client.ts`)
- [x] 서버 일괄 업로드 핸들러 — Zod 재검증 + 100건 배치 insert (`lib/excel/server.ts`)
- [x] `ExcelActions` 공통 컴포넌트 — 양식 / 업로드(대행사·셀러 선택) / 내보내기
- [x] 7개 모듈 `/api/{module}/excel-upload` 라우트
- [x] 7개 관리 페이지 상단 통합

**남은 작업**
- [ ] 순위조회 연동 (외부 크롤러) — PRD §6 제외 범위
- [ ] 필터 상태 URL searchParams 동기화
- [ ] 필수 필드 검증 엄격화 (네이버쇼핑 광고타입/랜딩/유입수 등)

상세는 `PRD.md`, `ARCHITECTURE.md`, `CONVENTIONS.md` 참고.

## 마이그레이션 적용 순서

```
supabase/migrations/0001_init_auth.sql     # profiles, agencies, sellers + RLS
supabase/migrations/0002_phase2_items.sql  # naver_shopping_items, place_items + RLS
supabase/migrations/0003_phase3_items.sql  # blog_items, traffic_items + RLS + Storage
supabase/migrations/0004_phase4_items.sql  # ohouse_items, kakao_map_items, auto_complete_items + RLS
```

Supabase Studio SQL Editor 에서 파일 순서대로 실행합니다.
`0003`은 `blog-attachments` Storage 버킷을 생성합니다. 이미 수동으로 만들어 둔 경우 `INSERT ... ON CONFLICT DO NOTHING`으로 안전합니다.
