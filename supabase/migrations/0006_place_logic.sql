-- ============================================================
-- 0006_place_logic.sql
-- 플레이스 / 카카오맵에 작업 "로직" 컬럼 추가
--   - 값: '로직1번' | '로직2번'
--   - 기존 행 보존을 위해 DB 컬럼은 NULL 허용 (필수 입력은 앱(Zod)에서 강제)
-- ============================================================

-- 플레이스
ALTER TABLE public.place_items
  ADD COLUMN IF NOT EXISTS logic TEXT
  CHECK (logic IN ('로직1번', '로직2번'));

-- 카카오맵 (플레이스와 동일 구조 공유)
ALTER TABLE public.kakao_map_items
  ADD COLUMN IF NOT EXISTS logic TEXT
  CHECK (logic IN ('로직1번', '로직2번'));
