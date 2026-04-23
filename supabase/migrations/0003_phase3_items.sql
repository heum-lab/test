-- ============================================================
-- Phase 3: 블로그 + 유입플 테이블
-- ============================================================

-- ------------------------------------------------------------
-- 1. blog_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_items (
  id                  SERIAL PRIMARY KEY,
  agency_id           INTEGER REFERENCES public.agencies(id) ON DELETE SET NULL,
  seller_id           INTEGER REFERENCES public.sellers(id) ON DELETE SET NULL,
  place_name          TEXT NOT NULL,
  main_keyword        TEXT NOT NULL,
  ad_type             TEXT NOT NULL,
  search_keyword      TEXT,
  content_url         TEXT,
  store_url           TEXT,
  daily_publish_count INTEGER NOT NULL DEFAULT 0,
  total_publish_count INTEGER NOT NULL DEFAULT 0,
  attachment_path     TEXT,
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
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_filter
  ON public.blog_items (seller_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_agency ON public.blog_items (agency_id);

DROP TRIGGER IF EXISTS trg_blog_updated ON public.blog_items;
CREATE TRIGGER trg_blog_updated
  BEFORE UPDATE ON public.blog_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 2. traffic_items (네이버쇼핑과 동일 구조)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.traffic_items (
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

CREATE INDEX IF NOT EXISTS idx_traffic_filter
  ON public.traffic_items (seller_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_agency ON public.traffic_items (agency_id);
CREATE INDEX IF NOT EXISTS idx_traffic_end_date ON public.traffic_items (end_date);

DROP TRIGGER IF EXISTS trg_traffic_updated ON public.traffic_items;
CREATE TRIGGER trg_traffic_updated
  BEFORE UPDATE ON public.traffic_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------
ALTER TABLE public.blog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_items ENABLE ROW LEVEL SECURITY;

-- blog
DROP POLICY IF EXISTS "blog_super_all" ON public.blog_items;
CREATE POLICY "blog_super_all" ON public.blog_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "blog_agency_own" ON public.blog_items;
CREATE POLICY "blog_agency_own" ON public.blog_items
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM public.sellers
      WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "blog_seller_own" ON public.blog_items;
CREATE POLICY "blog_seller_own" ON public.blog_items
  FOR ALL USING (
    seller_id = (SELECT seller_id FROM public.profiles WHERE id = auth.uid())
  );

-- traffic
DROP POLICY IF EXISTS "traffic_super_all" ON public.traffic_items;
CREATE POLICY "traffic_super_all" ON public.traffic_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "traffic_agency_own" ON public.traffic_items;
CREATE POLICY "traffic_agency_own" ON public.traffic_items
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM public.sellers
      WHERE agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "traffic_seller_own" ON public.traffic_items;
CREATE POLICY "traffic_seller_own" ON public.traffic_items
  FOR ALL USING (
    seller_id = (SELECT seller_id FROM public.profiles WHERE id = auth.uid())
  );

-- ------------------------------------------------------------
-- 4. Storage 버킷 (블로그 첨부파일)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-attachments', 'blog-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자는 업로드 가능
DROP POLICY IF EXISTS "blog_attach_upload" ON storage.objects;
CREATE POLICY "blog_attach_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-attachments');

-- 인증된 사용자는 본인 객체 또는 super_admin/agency 는 전체 조회
DROP POLICY IF EXISTS "blog_attach_read" ON storage.objects;
CREATE POLICY "blog_attach_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'blog-attachments');

DROP POLICY IF EXISTS "blog_attach_delete" ON storage.objects;
CREATE POLICY "blog_attach_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'blog-attachments'
    AND (
      owner = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    )
  );
