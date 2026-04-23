-- ============================================================
-- Phase 2: 네이버쇼핑 + 플레이스 아이템 테이블
-- ============================================================

-- ------------------------------------------------------------
-- 1. naver_shopping_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.naver_shopping_items (
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

CREATE INDEX IF NOT EXISTS idx_naver_shopping_filter
  ON public.naver_shopping_items (seller_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_naver_shopping_agency
  ON public.naver_shopping_items (agency_id);
CREATE INDEX IF NOT EXISTS idx_naver_shopping_end_date
  ON public.naver_shopping_items (end_date);

DROP TRIGGER IF EXISTS trg_naver_shopping_updated ON public.naver_shopping_items;
CREATE TRIGGER trg_naver_shopping_updated
  BEFORE UPDATE ON public.naver_shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 2. place_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.place_items (
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

CREATE INDEX IF NOT EXISTS idx_place_filter
  ON public.place_items (seller_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_place_agency
  ON public.place_items (agency_id);
CREATE INDEX IF NOT EXISTS idx_place_end_date
  ON public.place_items (end_date);

DROP TRIGGER IF EXISTS trg_place_updated ON public.place_items;
CREATE TRIGGER trg_place_updated
  BEFORE UPDATE ON public.place_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------
ALTER TABLE public.naver_shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_items ENABLE ROW LEVEL SECURITY;

-- super_admin 전체 접근
DROP POLICY IF EXISTS "ns_super_all" ON public.naver_shopping_items;
CREATE POLICY "ns_super_all" ON public.naver_shopping_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- agency: 소속 셀러 전체
DROP POLICY IF EXISTS "ns_agency_own" ON public.naver_shopping_items;
CREATE POLICY "ns_agency_own" ON public.naver_shopping_items
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM public.sellers
      WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- seller: 본인만
DROP POLICY IF EXISTS "ns_seller_own" ON public.naver_shopping_items;
CREATE POLICY "ns_seller_own" ON public.naver_shopping_items
  FOR ALL USING (
    seller_id = (SELECT seller_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "place_super_all" ON public.place_items;
CREATE POLICY "place_super_all" ON public.place_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "place_agency_own" ON public.place_items;
CREATE POLICY "place_agency_own" ON public.place_items
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM public.sellers
      WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "place_seller_own" ON public.place_items;
CREATE POLICY "place_seller_own" ON public.place_items
  FOR ALL USING (
    seller_id = (SELECT seller_id FROM public.profiles WHERE id = auth.uid())
  );
