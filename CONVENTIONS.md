# CONVENTIONS.md — 코딩 컨벤션

## 1. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript 5 (strict mode) |
| 스타일 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui |
| 백엔드/DB | Supabase (PostgreSQL + Auth + Storage) |
| 상태관리 | Zustand (클라이언트) + TanStack Query v5 (서버) |
| 폼 | React Hook Form + Zod |
| 엑셀 | SheetJS (xlsx) |
| 날짜 | date-fns (한국 로케일) |
| 테스트 | Vitest + Testing Library |
| 린터 | ESLint (eslint-config-next) + Prettier |

---

## 2. 프로젝트 구조

```
onepickacount/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 레이아웃 그룹
│   │   └── login/
│   │       └── page.tsx
│   ├── (admin)/                  # 어드민 레이아웃 그룹
│   │   ├── layout.tsx            # 공통 레이아웃 (사이드바/헤더)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── naver-shopping/
│   │   │   └── page.tsx
│   │   ├── place/
│   │   │   └── page.tsx
│   │   ├── traffic/
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   └── page.tsx
│   │   ├── ohouse/
│   │   │   └── page.tsx
│   │   ├── kakao-map/
│   │   │   └── page.tsx
│   │   ├── auto-complete/
│   │   │   └── page.tsx
│   │   ├── agency/
│   │   │   └── page.tsx
│   │   └── seller/
│   │       └── page.tsx
│   └── api/                      # Route Handlers
│       ├── naver-shopping/
│       │   └── route.ts
│       ├── place/
│       │   └── route.ts
│       ├── blog/
│       │   └── route.ts
│       └── excel/
│           └── route.ts
│
├── components/
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   ├── common/
│   │   ├── DataTable.tsx         # 공통 테이블 (필터·페이지네이션 포함)
│   │   ├── SearchFilter.tsx      # 공통 검색 필터
│   │   ├── StatusBadge.tsx       # 상태 뱃지
│   │   ├── DateRangePicker.tsx   # 날짜 범위 선택
│   │   ├── QuickDateSelector.tsx # 간편 날짜 선택
│   │   ├── BulkActionBar.tsx     # 일괄 처리 버튼 모음
│   │   ├── ExcelUploader.tsx     # 엑셀 업로드
│   │   └── ConfirmDialog.tsx     # 확인 다이얼로그
│   ├── naver-shopping/
│   │   ├── NaverShoppingTable.tsx
│   │   ├── NaverShoppingForm.tsx
│   │   └── NaverShoppingModal.tsx
│   ├── place/
│   │   ├── PlaceTable.tsx
│   │   ├── PlaceForm.tsx
│   │   └── PlaceModal.tsx
│   ├── blog/
│   │   ├── BlogTable.tsx
│   │   ├── BlogForm.tsx
│   │   └── BlogModal.tsx
│   └── [module]/                 # 각 모듈별 동일 패턴
│
├── hooks/
│   ├── useNaverShopping.ts       # TanStack Query hooks
│   ├── usePlace.ts
│   ├── useBlog.ts
│   ├── useAgency.ts
│   ├── useSeller.ts
│   └── useExcel.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 브라우저용 Supabase client
│   │   ├── server.ts             # 서버용 Supabase client
│   │   └── middleware.ts
│   ├── utils.ts                  # cn() 등 유틸리티
│   ├── constants.ts              # 상수 (상태값, 광고타입 등)
│   └── validations/
│       ├── naver-shopping.ts     # Zod 스키마
│       ├── place.ts
│       └── blog.ts
│
├── stores/
│   └── uiStore.ts                # Zustand (모달 열림/닫힘 등 UI 상태)
│
├── types/
│   ├── index.ts                  # 공통 타입
│   ├── naver-shopping.ts
│   ├── place.ts
│   ├── blog.ts
│   └── supabase.ts               # Supabase 자동 생성 타입
│
└── middleware.ts                 # 인증 미들웨어
```

---

## 3. 네이밍 컨벤션

### 파일 & 폴더

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `NaverShoppingTable.tsx` |
| 페이지 파일 | lowercase (Next.js) | `page.tsx`, `layout.tsx` |
| 훅 파일 | camelCase with `use` prefix | `useNaverShopping.ts` |
| 유틸 파일 | camelCase | `dateUtils.ts` |
| 타입 파일 | kebab-case | `naver-shopping.ts` |
| 상수 파일 | camelCase | `constants.ts` |
| 폴더명 | kebab-case | `naver-shopping/`, `auto-complete/` |

### 변수 & 함수

```typescript
// ✅ 변수: camelCase
const isLoading = true;
const totalCount = 210;

// ✅ 상수: SCREAMING_SNAKE_CASE
const MAX_PAGE_SIZE = 150;
const STATUS_OPTIONS = ['대기', '작업중', '작업완료'] as const;

// ✅ 타입/인터페이스: PascalCase (I 접두사 없음)
type NaverShoppingItem = { ... };
interface FilterParams { ... }

// ✅ 이벤트 핸들러: handle 접두사
const handleSubmit = () => {};
const handleStatusChange = () => {};

// ✅ boolean 변수: is/has/can 접두사
const isModalOpen = false;
const hasEditPermission = true;

// ✅ 비동기 함수: 동사 + 명사
async function fetchNaverShoppingList() {}
async function createNaverShoppingItem() {}
async function updateItemStatus() {}
async function deleteItem() {}
```

### Supabase 테이블명
- **snake_case 복수형** 사용
- 예: `naver_shopping_items`, `place_items`, `blog_items`, `agencies`, `sellers`

### API Route
- **kebab-case** 사용
- 예: `/api/naver-shopping`, `/api/auto-complete`, `/api/excel/download`

---

## 4. 컴포넌트 작성 규칙

```typescript
// ✅ 함수형 컴포넌트 + named export (default export는 page.tsx만 허용)
// ✅ Props 타입은 컴포넌트 파일 상단에 정의
// ✅ props destructuring 사용

type NaverShoppingTableProps = {
  items: NaverShoppingItem[];
  isLoading: boolean;
  onStatusChange: (id: number, status: ItemStatus) => void;
};

export function NaverShoppingTable({
  items,
  isLoading,
  onStatusChange,
}: NaverShoppingTableProps) {
  // ...
}
```

---

## 5. 상태 관리 규칙

- **서버 데이터** → TanStack Query (useQuery, useMutation)
- **전역 UI 상태** → Zustand (모달 열림 여부, 선택된 행 등)
- **폼 상태** → React Hook Form 내부
- **URL 상태** → Next.js searchParams (필터, 페이지 번호)

```typescript
// 필터는 URL searchParams로 관리
// /admin/naver-shopping?agency=1&seller=7&status=작업중&page=2
```

---

## 6. Supabase 사용 규칙

```typescript
// ✅ 서버 컴포넌트에서: server client 사용
import { createClient } from '@/lib/supabase/server';

// ✅ 클라이언트 컴포넌트에서: browser client 사용
import { createClient } from '@/lib/supabase/client';

// ✅ Row 타입은 Supabase CLI로 자동 생성 후 사용
import type { Database } from '@/types/supabase';
type NaverShoppingRow = Database['public']['Tables']['naver_shopping_items']['Row'];
```

---

## 7. 에러 처리

```typescript
// ✅ API Route에서 일관된 응답 형식
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

// ✅ 클라이언트에서 toast로 에러 표시
import { toast } from 'sonner';
toast.error('저장에 실패했습니다.');
toast.success('저장되었습니다.');
```

---

## 8. 스타일 규칙

```tsx
// ✅ Tailwind CSS 클래스 사용
// ✅ cn() 유틸로 조건부 클래스 처리
import { cn } from '@/lib/utils';

<div className={cn(
  'rounded-md border px-3 py-2',
  isActive && 'bg-blue-500 text-white',
)} />

// ✅ 색상은 Tailwind 시맨틱 변수 사용 (shadcn/ui 기준)
// primary, secondary, destructive, muted, accent
```

---

## 9. Git 커밋 컨벤션

```
feat: 네이버쇼핑 목록 필터 기능 추가
fix: 블로그 엑셀 업로드 날짜 파싱 오류 수정
refactor: DataTable 컴포넌트 공통화
chore: Supabase 타입 재생성
docs: ARCHITECTURE.md 업데이트
style: ESLint 경고 정리
test: NaverShoppingForm 유닛 테스트 추가
```

---

## 10. 금지 사항

- `any` 타입 사용 금지 (unknown 또는 구체 타입 사용)
- `useEffect` 내 data fetching 금지 (TanStack Query 사용)
- 직접 DOM 조작 금지
- `console.log` 를 프로덕션 코드에 남기지 않음
- 하드코딩된 API URL 금지 (`process.env` 또는 `constants.ts` 사용)
