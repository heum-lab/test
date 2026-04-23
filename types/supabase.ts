// NOTE: 실제 Supabase 스키마 연결 후 `supabase gen types typescript` 로 자동 생성할 파일.
// Phase 1~5 범위 수동 정의.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ItemStatus =
  | '대기'
  | '작업중'
  | '중지'
  | '환불요청'
  | '환불완료'
  | '연장처리'
  | '작업완료'
  | '삭제요청';

type BlogStatus = '대기' | '작업중' | '작업완료';

type NaverShoppingRow = {
  id: number;
  agency_id: number | null;
  seller_id: number | null;
  keyword: string;
  sub_keyword1: string | null;
  sub_keyword2: string | null;
  product_mid: string;
  product_url: string | null;
  price_compare_mid: string | null;
  price_compare_url: string | null;
  ad_type: string | null;
  landing_type: string | null;
  traffic_count: number | null;
  order_date: string | null;
  start_date: string;
  end_date: string;
  refund_date: string | null;
  payment_date: string | null;
  status: ItemStatus;
  initial_rank: number | null;
  current_rank: number | null;
  yesterday_rank: number | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

type NaverShoppingInsert = {
  id?: number;
  agency_id: number | null;
  seller_id: number | null;
  keyword: string;
  sub_keyword1?: string | null;
  sub_keyword2?: string | null;
  product_mid: string;
  product_url?: string | null;
  price_compare_mid?: string | null;
  price_compare_url?: string | null;
  ad_type?: string | null;
  landing_type?: string | null;
  traffic_count?: number | null;
  order_date?: string | null;
  start_date: string;
  end_date: string;
  refund_date?: string | null;
  payment_date?: string | null;
  status?: ItemStatus;
  initial_rank?: number | null;
  current_rank?: number | null;
  yesterday_rank?: number | null;
  memo?: string | null;
  created_at?: string;
  updated_at?: string;
};

type PlaceRow = {
  id: number;
  agency_id: number | null;
  seller_id: number | null;
  store_name: string;
  main_keyword: string;
  ad_type: string;
  search_keyword: string;
  category: string | null;
  place_url: string;
  traffic_count: number | null;
  payment_amount: number | null;
  order_date: string | null;
  start_date: string;
  end_date: string;
  refund_date: string | null;
  payment_date: string | null;
  status: ItemStatus;
  initial_rank: number | null;
  current_rank: number | null;
  yesterday_rank: number | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

type PlaceInsert = {
  id?: number;
  agency_id: number | null;
  seller_id: number | null;
  store_name: string;
  main_keyword: string;
  ad_type: string;
  search_keyword: string;
  category?: string | null;
  place_url: string;
  traffic_count?: number | null;
  payment_amount?: number | null;
  order_date?: string | null;
  start_date: string;
  end_date: string;
  refund_date?: string | null;
  payment_date?: string | null;
  status?: ItemStatus;
  initial_rank?: number | null;
  current_rank?: number | null;
  yesterday_rank?: number | null;
  memo?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'super_admin' | 'agency' | 'seller';
          agency_id: number | null;
          seller_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: 'super_admin' | 'agency' | 'seller';
          agency_id?: number | null;
          seller_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'super_admin' | 'agency' | 'seller';
          agency_id?: number | null;
          seller_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agencies: {
        Row: {
          id: number;
          parent_name: string;
          name: string;
          username: string;
          phone: string | null;
          email: string | null;
          memo: string | null;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          parent_name: string;
          name: string;
          username: string;
          phone?: string | null;
          email?: string | null;
          memo?: string | null;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          parent_name?: string;
          name?: string;
          username?: string;
          phone?: string | null;
          email?: string | null;
          memo?: string | null;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sellers: {
        Row: {
          id: number;
          seller_code: number;
          parent_name: string;
          agency_id: number | null;
          name: string;
          username: string;
          phone: string | null;
          email: string | null;
          memo: string | null;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          seller_code: number;
          parent_name: string;
          agency_id?: number | null;
          name: string;
          username: string;
          phone?: string | null;
          email?: string | null;
          memo?: string | null;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          seller_code?: number;
          parent_name?: string;
          agency_id?: number | null;
          name?: string;
          username?: string;
          phone?: string | null;
          email?: string | null;
          memo?: string | null;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      naver_shopping_items: {
        Row: NaverShoppingRow;
        Insert: NaverShoppingInsert;
        Update: Partial<NaverShoppingInsert>;
        Relationships: [];
      };
      place_items: {
        Row: PlaceRow;
        Insert: PlaceInsert;
        Update: Partial<PlaceInsert>;
        Relationships: [];
      };
      blog_items: {
        Row: {
          id: number;
          agency_id: number | null;
          seller_id: number | null;
          place_name: string;
          main_keyword: string;
          ad_type: string;
          search_keyword: string | null;
          content_url: string | null;
          store_url: string | null;
          daily_publish_count: number;
          total_publish_count: number;
          attachment_path: string | null;
          order_date: string | null;
          start_date: string;
          end_date: string;
          payment_date: string | null;
          status: BlogStatus;
          initial_rank: number | null;
          current_rank: number | null;
          yesterday_rank: number | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          agency_id: number | null;
          seller_id: number | null;
          place_name: string;
          main_keyword: string;
          ad_type: string;
          search_keyword?: string | null;
          content_url?: string | null;
          store_url?: string | null;
          daily_publish_count?: number;
          total_publish_count?: number;
          attachment_path?: string | null;
          order_date?: string | null;
          start_date: string;
          end_date: string;
          payment_date?: string | null;
          status?: BlogStatus;
          initial_rank?: number | null;
          current_rank?: number | null;
          yesterday_rank?: number | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blog_items']['Insert']>;
        Relationships: [];
      };
      traffic_items: {
        Row: NaverShoppingRow;
        Insert: NaverShoppingInsert;
        Update: Partial<NaverShoppingInsert>;
        Relationships: [];
      };
      ohouse_items: {
        Row: NaverShoppingRow;
        Insert: NaverShoppingInsert;
        Update: Partial<NaverShoppingInsert>;
        Relationships: [];
      };
      kakao_map_items: {
        Row: PlaceRow;
        Insert: PlaceInsert;
        Update: Partial<PlaceInsert>;
        Relationships: [];
      };
      auto_complete_items: {
        Row: {
          id: number;
          agency_id: number | null;
          seller_id: number | null;
          keyword: string;
          expose_start_date: string;
          guarantee_end_date: string;
          status: ItemStatus;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          agency_id: number | null;
          seller_id: number | null;
          keyword: string;
          expose_start_date: string;
          guarantee_end_date: string;
          status?: ItemStatus;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['auto_complete_items']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
