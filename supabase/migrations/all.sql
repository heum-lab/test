-- ============================================================
-- ONEPICKACOUNT CRM - 초기 인증/조직 스키마
-- profiles, agencies, sellers + RLS
-- ============================================================

-- ------------------------------------------------------------
-- 1. agencies (대행사)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agencies (
  id            SERIAL PRIMARY KEY,
  parent_name   TEXT NOT NULL,
  name          TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  phone         TEXT,
  email         TEXT,
  memo          TEXT,
  is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agencies_username ON public.agencies (username);
CREATE INDEX IF NOT EXISTS idx_agencies_approved ON public.agencies (is_approved);

-- ------------------------------------------------------------
-- 2. sellers (셀러)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sellers (
  id          SERIAL PRIMARY KEY,
  seller_code INTEGER UNIQUE NOT NULL,
  parent_name TEXT NOT NULL,
  agency_id   INTEGER REFERENCES public.agencies(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  phone       TEXT,
  email       TEXT,
  memo        TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sellers_agency ON public.sellers (agency_id);
CREATE INDEX IF NOT EXISTS idx_sellers_username ON public.sellers (username);
CREATE INDEX IF NOT EXISTS idx_sellers_approved ON public.sellers (is_approved);

-- seller_code 자동 시작값 (10000부터)
CREATE SEQUENCE IF NOT EXISTS sellers_seller_code_seq START 10000;

-- ------------------------------------------------------------
-- 3. profiles (auth.users 확장 — role + 조직 연결)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('super_admin', 'agency', 'seller')),
  agency_id   INTEGER REFERENCES public.agencies(id) ON DELETE SET NULL,
  seller_id   INTEGER REFERENCES public.sellers(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- ------------------------------------------------------------
-- 4. updated_at 자동 갱신 트리거
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agencies_updated ON public.agencies;
CREATE TRIGGER trg_agencies_updated
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sellers_updated ON public.sellers;
CREATE TRIGGER trg_sellers_updated
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 5. Row Level Security 정책
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- profiles: 본인만 조회, super_admin은 전체
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- agencies: super_admin 전체, 대행사는 본인 레코드만
DROP POLICY IF EXISTS "agencies_super_all" ON public.agencies;
CREATE POLICY "agencies_super_all" ON public.agencies
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "agencies_self_read" ON public.agencies;
CREATE POLICY "agencies_self_read" ON public.agencies
  FOR SELECT USING (
    id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- sellers: super_admin 전체, 대행사는 소속 셀러, 셀러는 본인만
DROP POLICY IF EXISTS "sellers_super_all" ON public.sellers;
CREATE POLICY "sellers_super_all" ON public.sellers
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "sellers_agency_own" ON public.sellers;
CREATE POLICY "sellers_agency_own" ON public.sellers
  FOR SELECT USING (
    agency_id = (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "sellers_self_read" ON public.sellers;
CREATE POLICY "sellers_self_read" ON public.sellers
  FOR SELECT USING (
    id = (SELECT seller_id FROM public.profiles WHERE id = auth.uid())
  );

-- ------------------------------------------------------------
-- 6. 회원가입 시 profile 자동 생성 트리거
--   raw_user_meta_data 에 담긴 role/agency_id/seller_id 로 세팅
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'seller');

  INSERT INTO public.profiles (id, role, agency_id, seller_id)
  VALUES (
    NEW.id,
    v_role,
    NULLIF(NEW.raw_user_meta_data->>'agency_id', '')::INTEGER,
    NULLIF(NEW.raw_user_meta_data->>'seller_id', '')::INTEGER
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
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
