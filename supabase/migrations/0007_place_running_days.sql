-- ============================================================
-- 0007_place_running_days.sql
-- 플레이스 리스트 "구동일" 정렬용 계산 컬럼 추가
--   구동일 = 종료일 - 시작일 + 1 (시작/종료일 모두 NOT NULL)
--   STORED generated column 이라 서버(DB) 정렬 가능
-- ============================================================

ALTER TABLE public.place_items
  ADD COLUMN IF NOT EXISTS running_days INTEGER
  GENERATED ALWAYS AS (end_date - start_date + 1) STORED;

-- PostgREST 스키마 캐시 리로드 (새 컬럼 즉시 인식)
NOTIFY pgrst, 'reload schema';
