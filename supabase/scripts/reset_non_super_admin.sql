-- ============================================================
-- 계정 초기화 스크립트 — super_admin 제외 전부 삭제
-- ============================================================
-- 실행: Supabase Studio → SQL Editor 에 붙여넣고 RUN
--
-- 삭제 대상:
--   1) public.sellers 전체 행
--   2) public.agencies 전체 행
--   3) auth.users 중 role <> 'super_admin' 인 계정
--      → public.profiles 는 ON DELETE CASCADE 로 자동 삭제됨
--
-- 보존 대상:
--   - role = 'super_admin' 인 auth.users + profiles
--   - naver_shopping_items, place_items, blog_items, traffic_items,
--     ohouse_items, kakao_map_items, auto_complete_items
--     (FK 가 ON DELETE SET NULL 이라 agency_id/seller_id 만 NULL 로 변경됨)
--
-- 주의: 트랜잭션으로 감싸 두었으니, 결과가 이상하면 COMMIT 대신 ROLLBACK 으로 되돌릴 것.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- [1/4] 사전 확인 — 삭제 대상 미리보기
-- ------------------------------------------------------------
-- 삭제될 auth.users 목록
SELECT u.id, u.email, COALESCE(p.role, '(no profile)') AS role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE COALESCE(p.role, '') <> 'super_admin'
ORDER BY u.created_at;

-- 유지될 super_admin 목록 (반드시 1건 이상이어야 함)
SELECT u.id, u.email, p.role
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE p.role = 'super_admin';

-- ------------------------------------------------------------
-- [2/4] sellers 전체 삭제
--   → *_items.seller_id 는 ON DELETE SET NULL 로 처리됨
-- ------------------------------------------------------------
DELETE FROM public.sellers;

-- ------------------------------------------------------------
-- [3/4] agencies 전체 삭제
--   → *_items.agency_id, profiles.agency_id 는 ON DELETE SET NULL
-- ------------------------------------------------------------
DELETE FROM public.agencies;

-- ------------------------------------------------------------
-- [4/4] auth.users 에서 super_admin 이 아닌 계정 전부 삭제
--   → public.profiles 는 ON DELETE CASCADE 로 함께 삭제
-- ------------------------------------------------------------
DELETE FROM auth.users
WHERE id NOT IN (
  SELECT id FROM public.profiles WHERE role = 'super_admin'
);

-- ------------------------------------------------------------
-- 결과 검증
-- ------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM auth.users)        AS remaining_users,
  (SELECT COUNT(*) FROM public.profiles)   AS remaining_profiles,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'super_admin') AS super_admins,
  (SELECT COUNT(*) FROM public.agencies)   AS agencies,
  (SELECT COUNT(*) FROM public.sellers)    AS sellers;

-- 결과가 예상대로면 ↓ 주석을 풀어 확정 (또는 그냥 RUN 시 자동 커밋되는 환경이면 그대로 둠)
COMMIT;

-- 되돌리려면 위 COMMIT 대신:
-- ROLLBACK;

-- ============================================================
-- (선택) 시퀀스 리셋 — 다음에 만들 agency/seller id 를 1, 10000 부터 다시 시작하고 싶다면 아래 실행
-- ============================================================
-- ALTER SEQUENCE public.agencies_id_seq RESTART WITH 1;
-- ALTER SEQUENCE public.sellers_id_seq RESTART WITH 1;
-- ALTER SEQUENCE public.sellers_seller_code_seq RESTART WITH 10000;
