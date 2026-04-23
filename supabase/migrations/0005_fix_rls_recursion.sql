-- ============================================================
-- RLS 무한 재귀 수정
-- profiles 내부에서 profiles를 조회하던 정책을 SECURITY DEFINER 함수로 교체
-- ============================================================

-- ------------------------------------------------------------
-- 1. RLS를 우회하는 헬퍼 함수들 (SECURITY DEFINER)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_agency_id()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_seller_id()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT seller_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ------------------------------------------------------------
-- 2. profiles 정책 재작성 (재귀 제거)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.current_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR public.current_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
    OR public.current_role() = 'super_admin'
  );

-- ------------------------------------------------------------
-- 3. agencies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "agencies_super_all" ON public.agencies;
CREATE POLICY "agencies_super_all" ON public.agencies
  FOR ALL USING (public.current_role() = 'super_admin');

DROP POLICY IF EXISTS "agencies_self_read" ON public.agencies;
CREATE POLICY "agencies_self_read" ON public.agencies
  FOR SELECT USING (id = public.current_agency_id());

-- ------------------------------------------------------------
-- 4. sellers
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sellers_super_all" ON public.sellers;
CREATE POLICY "sellers_super_all" ON public.sellers
  FOR ALL USING (public.current_role() = 'super_admin');

DROP POLICY IF EXISTS "sellers_agency_own" ON public.sellers;
CREATE POLICY "sellers_agency_own" ON public.sellers
  FOR SELECT USING (agency_id = public.current_agency_id());

DROP POLICY IF EXISTS "sellers_self_read" ON public.sellers;
CREATE POLICY "sellers_self_read" ON public.sellers
  FOR SELECT USING (id = public.current_seller_id());

-- ------------------------------------------------------------
-- 5. 항목 테이블 공통 패턴 (naver_shopping/place/blog/traffic/ohouse/kakao_map/auto_complete)
-- ------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'naver_shopping_items',
    'place_items',
    'blog_items',
    'traffic_items',
    'ohouse_items',
    'kakao_map_items',
    'auto_complete_items'
  ];
  prefix_map JSONB := '{
    "naver_shopping_items": "ns",
    "place_items": "place",
    "blog_items": "blog",
    "traffic_items": "traffic",
    "ohouse_items": "ohouse",
    "kakao_map_items": "kakao_map",
    "auto_complete_items": "autocomplete"
  }';
  p TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    p := prefix_map->>t;

    EXECUTE format('DROP POLICY IF EXISTS "%s_super_all" ON public.%I', p, t);
    EXECUTE format(
      'CREATE POLICY "%s_super_all" ON public.%I FOR ALL USING (public.current_role() = ''super_admin'')',
      p, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "%s_agency_own" ON public.%I', p, t);
    EXECUTE format(
      'CREATE POLICY "%s_agency_own" ON public.%I FOR ALL USING (' ||
      'seller_id IN (SELECT id FROM public.sellers WHERE agency_id = public.current_agency_id())' ||
      ')',
      p, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "%s_seller_own" ON public.%I', p, t);
    EXECUTE format(
      'CREATE POLICY "%s_seller_own" ON public.%I FOR ALL USING (seller_id = public.current_seller_id())',
      p, t
    );
  END LOOP;
END $$;
