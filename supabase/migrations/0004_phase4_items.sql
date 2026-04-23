-- ============================================================
-- Phase 4: 오늘의집 + 카카오맵 + 자동완성
-- ============================================================

-- ------------------------------------------------------------
-- 1. ohouse_items (네이버쇼핑과 동일 구조)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ohouse_items (
  id                SERIAL PRIMARY KEY,
  agency_id         INTEGER REFERENCES public.agencies(id) ON DELETE SET NULL,
  seller_id         INTEGER REFERENCES public.sellers(id) ON DELETE SET NULL,
  keyword           TEXT NOT NULL,
  sub_keyword1      TEXT,
  sub_keyword2      TEXT,
  product_mid       TEXT NOT NULL,
  product_url       TEXT,
  price_compare_mid TEXT,
  price_compare_url TEXT,
  ad_type           TEXT,
  landing_type      TEXT,
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
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ohouse_filter
  ON public.ohouse_items (seller_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_ohouse_agency ON public.ohouse_items (agency_id);

DROP TRIGGER IF EXISTS trg_ohouse_updated ON public.ohouse_items;
CREATE TRIGGER trg_ohouse_updated
  BEFORE UPDATE ON public.ohouse_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 2. kakao_map_items (플레이스와 동일 구조)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kakao_map_items (
  id              SERIAL PRIMARY KEY,
  agency_id       INTEGER REFERENCES public.agencies(id) ON DELETE SET NULL,
  seller_id       INTEGER REFERENCES public.sellers(id) ON DELETE SET NULL,
  store_name      TEXT NOT NULL,
  main_keyword    TEXT NOT NULL,
  ad_type         TEXT NOT NULL,
  search_keyword  TEXT NOT NULL,
  category        TEXT,
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
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kakao_map_filter
  ON public.kakao_map_items (seller_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_kakao_map_agency ON public.kakao_map_items (agency_id);

DROP TRIGGER IF EXISTS trg_kakao_map_updated ON public.kakao_map_items;
CREATE TRIGGER trg_kakao_map_updated
  BEFORE UPDATE ON public.kakao_map_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 3. auto_complete_items (고유 구조)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auto_complete_items (
  id                  SERIAL PRIMARY KEY,
  agency_id           INTEGER REFERENCES public.agencies(id) ON DELETE SET NULL,
  seller_id           INTEGER REFERENCES public.sellers(id) ON DELETE SET NULL,
  keyword             TEXT NOT NULL,
  expose_start_date   DATE NOT NULL,
  guarantee_end_date  DATE NOT NULL,
  status              TEXT NOT NULL DEFAULT '대기'
                      CHECK (status IN ('대기','작업중','중지','환불요청','환불완료','연장처리','작업완료','삭제요청')),
  memo                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autocomplete_filter
  ON public.auto_complete_items (seller_id, status, expose_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_autocomplete_agency
  ON public.auto_complete_items (agency_id);

DROP TRIGGER IF EXISTS trg_autocomplete_updated ON public.auto_complete_items;
CREATE TRIGGER trg_autocomplete_updated
  BEFORE UPDATE ON public.auto_complete_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
ALTER TABLE public.ohouse_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kakao_map_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_complete_items ENABLE ROW LEVEL SECURITY;

-- ohouse
DROP POLICY IF EXISTS "ohouse_super_all" ON public.ohouse_items;
CREATE POLICY "ohouse_super_all" ON public.ohouse_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "ohouse_agency_own" ON public.ohouse_items;
CREATE POLICY "ohouse_agency_own" ON public.ohouse_items
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM public.sellers
      WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "ohouse_seller_own" ON public.ohouse_items;
CREATE POLICY "ohouse_seller_own" ON public.ohouse_items
  FOR ALL USING (
    seller_id = (SELECT seller_id FROM public.profiles WHERE id = auth.uid())
  );

-- kakao_map
DROP POLICY IF EXISTS "kakao_map_super_all" ON public.kakao_map_items;
CREATE POLICY "kakao_map_super_all" ON public.kakao_map_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "kakao_map_agency_own" ON public.kakao_map_items;
CREATE POLICY "kakao_map_agency_own" ON public.kakao_map_items
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM public.sellers
      WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "kakao_map_seller_own" ON public.kakao_map_items;
CREATE POLICY "kakao_map_seller_own" ON public.kakao_map_items
  FOR ALL USING (
    seller_id = (SELECT seller_id FROM public.profiles WHERE id = auth.uid())
  );

-- auto_complete
DROP POLICY IF EXISTS "autocomplete_super_all" ON public.auto_complete_items;
CREATE POLICY "autocomplete_super_all" ON public.auto_complete_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "autocomplete_agency_own" ON public.auto_complete_items;
CREATE POLICY "autocomplete_agency_own" ON public.auto_complete_items
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM public.sellers
      WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "autocomplete_seller_own" ON public.auto_complete_items;
CREATE POLICY "autocomplete_seller_own" ON public.auto_complete_items
  FOR ALL USING (
    seller_id = (SELECT seller_id FROM public.profiles WHERE id = auth.uid())
  );
