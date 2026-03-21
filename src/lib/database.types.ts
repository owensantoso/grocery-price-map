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
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          chain_name: string | null;
          address_text: string;
          latitude: number;
          longitude: number;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          chain_name?: string | null;
          address_text: string;
          latitude: number;
          longitude: number;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          chain_name?: string | null;
          address_text?: string;
          latitude?: number;
          longitude?: number;
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
          normalized_price_yen: number;
          observed_at: string;
          notes: string | null;
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
          normalized_price_yen: number;
          observed_at: string;
          notes?: string | null;
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
          normalized_price_yen?: number;
          observed_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      measurement_unit: "count" | "piece" | "g" | "kg" | "ml" | "l";
    };
    CompositeTypes: Record<string, never>;
  };
};
