-- ============================================================
-- 총판(agencies) / 대행사(sellers) 계정 일괄 삭제
-- 원인: agencies/sellers 행은 비워졌는데 auth.users 에 이메일이 남아
--       "A user with this email address has already been registered" 발생
-- 처리: role 이 'agency' 또는 'seller' 인 auth.users 를 모두 삭제하고
--       agencies / sellers 테이블도 함께 정리
-- 보존: super_admin 계정
-- 영향: *_items 테이블의 agency_id / seller_id 는 ON DELETE SET NULL
-- ============================================================

BEGIN;

-- [1] 삭제 대상 미리 확인
SELECT u.id, u.email, COALESCE(p.role, '(no profile)') AS role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE COALESCE(p.role, 'agency') IN ('agency', 'seller')
ORDER BY u.created_at;

-- [2] sellers 테이블 비우기
DELETE FROM public.sellers;

-- [3] agencies 테이블 비우기
DELETE FROM public.agencies;

-- [4] auth.users 중 agency / seller 역할 또는 profile 이 없는 계정 삭제
--     (profile 미생성된 고아 계정도 함께 정리)
DELETE FROM auth.users
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE COALESCE(p.role, 'agency') <> 'super_admin'
);

-- [5] 검증
SELECT
  (SELECT COUNT(*) FROM auth.users)                                  AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'super_admin')  AS super_admins,
  (SELECT COUNT(*) FROM public.agencies)                             AS agencies,
  (SELECT COUNT(*) FROM public.sellers)                              AS sellers;

COMMIT;
-- 결과가 이상하면 위 COMMIT 을 ROLLBACK 으로 바꿔 실행해 되돌릴 수 있습니다.
