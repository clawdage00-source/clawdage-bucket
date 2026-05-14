export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          plan_type: string;
          access_until: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          plan_type?: string;
          access_until?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          plan_type?: string;
          access_until?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          order_id: string;
          payment_id: string | null;
          amount: string;
          status: string;
          plan_selected: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id: string;
          payment_id?: string | null;
          amount: string;
          status: string;
          plan_selected: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string;
          payment_id?: string | null;
          amount?: string;
          status?: string;
          plan_selected?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tools: {
        Row: {
          id: number;
          name: string;
          slug: string;
          is_pro: boolean;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          is_pro?: boolean;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          is_pro?: boolean;
        };
        Relationships: [];
      };
      tool_usage: {
        Row: {
          id: string;
          user_id: string;
          tool_name: string;
          used_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_name: string;
          used_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_name?: string;
          used_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tool_usage_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
