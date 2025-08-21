export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          category: string | null;
          created_at: string;
          current_value: number;
          group_id: string | null;
          id: string;
          kid_id: string | null;
          name: string;
          plan_type: string | null;
          plan_value: number | null;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          current_value?: number;
          group_id?: string | null;
          id?: string;
          kid_id?: string | null;
          name: string;
          plan_type?: string | null;
          plan_value?: number | null;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          current_value?: number;
          group_id?: string | null;
          id?: string;
          kid_id?: string | null;
          name?: string;
          plan_type?: string | null;
          plan_value?: number | null;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_kid_id_fkey";
            columns: ["kid_id"];
            isOneToOne: false;
            referencedRelation: "kids";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_reports: {
        Row: {
          activities: Json;
          created_at: string;
          date: string;
          id: string;
          kid_id: string;
          notes: string | null;
          status: string;
          total_points: number;
          updated_at: string;
        };
        Insert: {
          activities?: Json;
          created_at?: string;
          date: string;
          id?: string;
          kid_id: string;
          notes?: string | null;
          status?: string;
          total_points?: number;
          updated_at?: string;
        };
        Update: {
          activities?: Json;
          created_at?: string;
          date?: string;
          id?: string;
          kid_id?: string;
          notes?: string | null;
          status?: string;
          total_points?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_reports_kid_id_fkey";
            columns: ["kid_id"];
            isOneToOne: false;
            referencedRelation: "kids";
            referencedColumns: ["id"];
          }
        ];
      };
      families: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      family_members: {
        Row: {
          family_id: string;
          id: string;
          joined_at: string;
          user_id: string;
        };
        Insert: {
          family_id: string;
          id?: string;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          family_id?: string;
          id?: string;
          joined_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      kids: {
        Row: {
          best_streak: number;
          created_at: string;
          current_points: number;
          current_streak: number;
          id: string;
          monthly_goal: number;
          name: string;
          updated_at: string;
          user_id: string | null;
          created_by: string | null;
        };
        Insert: {
          best_streak?: number;
          created_at?: string;
          current_points?: number;
          current_streak?: number;
          id?: string;
          monthly_goal?: number;
          name: string;
          updated_at?: string;
          user_id?: string | null;
          created_by?: string | null;
        };
        Update: {
          best_streak?: number;
          created_at?: string;
          current_points?: number;
          current_streak?: number;
          id?: string;
          monthly_goal?: number;
          name?: string;
          updated_at?: string;
          user_id?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kids_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      family_invitations: {
        Row: {
          id: string;
          token: string;
          invited_email: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          token: string;
          invited_email?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          token?: string;
          invited_email?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "family_invitations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      gift_redemptions: {
        Row: {
          created_at: string;
          date_processed: string | null;
          date_requested: string;
          id: string;
          kid_id: string;
          notes: string | null;
          gift_id: string;
          processed_by: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          date_processed?: string | null;
          date_requested?: string;
          id?: string;
          kid_id: string;
          notes?: string | null;
          gift_id: string;
          processed_by?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          date_processed?: string | null;
          date_requested?: string;
          id?: string;
          kid_id?: string;
          notes?: string | null;
          gift_id?: string;
          processed_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gift_redemptions_kid_id_fkey";
            columns: ["kid_id"];
            isOneToOne: false;
            referencedRelation: "kids";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gift_redemptions_gift_id_fkey";
            columns: ["gift_id"];
            isOneToOne: false;
            referencedRelation: "gifts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gift_redemptions_processed_by_fkey";
            columns: ["processed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      groups: {
        Row: {
          created_at: string;
          id: string;
          kid_id: string;
          name: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kid_id: string;
          name: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kid_id?: string;
          name?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_kid_id_fkey";
            columns: ["kid_id"];
            isOneToOne: false;
            referencedRelation: "kids";
            referencedColumns: ["id"];
          }
        ];
      };
      gifts: {
        Row: {
          active: boolean;
          category: string | null;
          cost: number;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          requires_approval: boolean;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          category?: string | null;
          cost: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          requires_approval?: boolean;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category?: string | null;
          cost?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          requires_approval?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      score_entries: {
        Row: {
          activity: string;
          approved: boolean;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          date: string;
          id: string;
          kid_id: string;
          points: number;
          reason: string | null;
        };
        Insert: {
          activity: string;
          approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          date: string;
          id?: string;
          kid_id: string;
          points: number;
          reason?: string | null;
        };
        Update: {
          activity?: string;
          approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          date?: string;
          id?: string;
          kid_id?: string;
          points?: number;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "score_entries_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "score_entries_kid_id_fkey";
            columns: ["kid_id"];
            isOneToOne: false;
            referencedRelation: "kids";
            referencedColumns: ["id"];
          }
        ];
      };
      scoring_rules: {
        Row: {
          activity_id: string;
          bonus: number;
          created_at: string;
          id: string;
          kid_id: string;
          max_daily: number | null;
          points: number;
          streak: number;
          updated_at: string;
        };
        Insert: {
          activity_id: string;
          bonus?: number;
          created_at?: string;
          id?: string;
          kid_id: string;
          max_daily?: number | null;
          points?: number;
          streak?: number;
          updated_at?: string;
        };
        Update: {
          activity_id?: string;
          bonus?: number;
          created_at?: string;
          id?: string;
          kid_id?: string;
          max_daily?: number | null;
          points?: number;
          streak?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scoring_rules_kid_id_fkey";
            columns: ["kid_id"];
            isOneToOne: false;
            referencedRelation: "kids";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_scoring_rules_activity_id";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _user_id: string;
          _role: Database["public"]["Enums"]["app_role"];
        };
        Returns: boolean;
      };
      is_family_member: {
        Args: { _user_id: string; _kid_id: string };
        Returns: boolean;
      };
      create_kid_with_invite: {
        Args: { _name: string; _invited_email: string | null };
        Returns: { kid_id: string; token: string }[];
      };
      claim_family_invitation: {
        Args: { _token: string };
        Returns: { success: boolean }[];
      };
      create_family_invitation: {
        Args: { _invited_email: string | null };
        Returns: { token: string }[];
      };
    };
    Enums: {
      app_role: "parent" | "kid";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["parent", "kid"],
    },
  },
} as const;
