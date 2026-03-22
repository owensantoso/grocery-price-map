export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string;
          public_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email: string;
          public_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string;
          public_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          chain_name: string | null;
          store_kind: Database["public"]["Enums"]["store_kind"];
          store_url: string;
          address_text: string;
          latitude: number | null;
          longitude: number | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          chain_name?: string | null;
          store_kind?: Database["public"]["Enums"]["store_kind"];
          store_url: string;
          address_text: string;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          chain_name?: string | null;
          store_kind?: Database["public"]["Enums"]["store_kind"];
          store_url?: string;
          address_text?: string;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          comparison_unit: Database["public"]["Enums"]["measurement_unit"];
          comparison_basis_amount: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          comparison_unit: Database["public"]["Enums"]["measurement_unit"];
          comparison_basis_amount: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          comparison_unit?: Database["public"]["Enums"]["measurement_unit"];
          comparison_basis_amount?: number;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      price_logs: {
        Row: {
          id: string;
          store_id: string;
          item_id: string;
          submitted_by: string;
          package_amount: number;
          package_unit: Database["public"]["Enums"]["measurement_unit"];
          total_price_yen: number;
          price_tax_excluded_yen: number;
          normalized_price_yen: number;
          observed_at: string;
          notes: string | null;
          listing_url: string | null;
          photo_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          item_id: string;
          submitted_by: string;
          package_amount: number;
          package_unit: Database["public"]["Enums"]["measurement_unit"];
          total_price_yen: number;
          price_tax_excluded_yen: number;
          normalized_price_yen: number;
          observed_at: string;
          notes?: string | null;
          listing_url?: string | null;
          photo_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          item_id?: string;
          submitted_by?: string;
          package_amount?: number;
          package_unit?: Database["public"]["Enums"]["measurement_unit"];
          total_price_yen?: number;
          price_tax_excluded_yen?: number;
          normalized_price_yen?: number;
          observed_at?: string;
          notes?: string | null;
          listing_url?: string | null;
          photo_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      price_log_votes: {
        Row: {
          created_at: string;
          log_id: string;
          user_id: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          log_id: string;
          user_id: string;
          value: number;
        };
        Update: {
          created_at?: string;
          log_id?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [];
      };
      price_log_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          log_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          log_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          log_id?: string;
        };
        Relationships: [];
      };
      price_log_comment_votes: {
        Row: {
          comment_id: string;
          created_at: string;
          user_id: string;
          value: number;
        };
        Insert: {
          comment_id: string;
          created_at?: string;
          user_id: string;
          value: number;
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string | null;
          public_name: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      measurement_unit: "count" | "piece" | "g" | "kg" | "ml" | "l";
      store_kind: "physical" | "online";
    };
    CompositeTypes: Record<string, never>;
  };
};
