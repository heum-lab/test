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
