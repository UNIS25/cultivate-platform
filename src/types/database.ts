export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      collections: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          donor_organisation_id: string
          id: string
          is_public: boolean
          listing_id: string
          location_id: string
          match_id: string | null
          notes: string
          quantity_kg: number
          recipient_organisation_id: string
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["collection_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          donor_organisation_id: string
          id?: string
          is_public?: boolean
          listing_id: string
          location_id: string
          match_id?: string | null
          notes?: string
          quantity_kg: number
          recipient_organisation_id: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          donor_organisation_id?: string
          id?: string
          is_public?: boolean
          listing_id?: string
          location_id?: string
          match_id?: string | null
          notes?: string
          quantity_kg?: number
          recipient_organisation_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_donor_organisation_id_fkey"
            columns: ["donor_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "surplus_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "organisation_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_recipient_organisation_id_fkey"
            columns: ["recipient_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_resources: {
        Row: {
          audience: string
          content: string
          created_at: string
          created_by: string | null
          external_url: string | null
          id: string
          published_at: string | null
          resource_type: string
          slug: string
          status: Database["public"]["Enums"]["resource_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          audience: string
          content?: string
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          published_at?: string | null
          resource_type: string
          slug: string
          status?: Database["public"]["Enums"]["resource_status"]
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          content?: string
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          published_at?: string | null
          resource_type?: string
          slug?: string
          status?: Database["public"]["Enums"]["resource_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      governance_resources: {
        Row: {
          area: string
          audience: string
          content: string
          created_at: string
          created_by: string | null
          effort_label: string
          id: string
          priority: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["resource_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          audience?: string
          content?: string
          created_at?: string
          created_by?: string | null
          effort_label: string
          id?: string
          priority?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["resource_status"]
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          audience?: string
          content?: string
          created_at?: string
          created_by?: string | null
          effort_label?: string
          id?: string
          priority?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["resource_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      impact_records: {
        Row: {
          assumptions_snapshot: Json
          assumptions_version: string
          collection_id: string
          created_at: string
          created_by: string | null
          estimated_co2e_avoided_kg: number | null
          estimated_meals: number
          estimated_waste_avoided_kg: number
          financial_value_eur: number
          food_redistributed_kg: number
          id: string
          is_public: boolean
          organisation_id: string | null
          recorded_at: string
        }
        Insert: {
          assumptions_snapshot: Json
          assumptions_version: string
          collection_id: string
          created_at?: string
          created_by?: string | null
          estimated_co2e_avoided_kg?: number | null
          estimated_meals: number
          estimated_waste_avoided_kg: number
          financial_value_eur: number
          food_redistributed_kg: number
          id?: string
          is_public?: boolean
          organisation_id?: string | null
          recorded_at?: string
        }
        Update: {
          assumptions_snapshot?: Json
          assumptions_version?: string
          collection_id?: string
          created_at?: string
          created_by?: string | null
          estimated_co2e_avoided_kg?: number | null
          estimated_meals?: number
          estimated_waste_avoided_kg?: number
          financial_value_eur?: number
          food_redistributed_kg?: number
          id?: string
          is_public?: boolean
          organisation_id?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: true
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_records_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          blockers: Json
          created_at: string
          created_by: string | null
          distance_km: number
          eligible: boolean
          expires_at: string | null
          id: string
          listing_id: string
          recipient_organisation_id: string
          recommended_at: string
          responded_at: string | null
          score: number
          score_breakdown: Json
          scoring_method: string
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          blockers?: Json
          created_at?: string
          created_by?: string | null
          distance_km: number
          eligible?: boolean
          expires_at?: string | null
          id?: string
          listing_id: string
          recipient_organisation_id: string
          recommended_at?: string
          responded_at?: string | null
          score: number
          score_breakdown?: Json
          scoring_method: string
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          blockers?: Json
          created_at?: string
          created_by?: string | null
          distance_km?: number
          eligible?: boolean
          expires_at?: string | null
          id?: string
          listing_id?: string
          recipient_organisation_id?: string
          recommended_at?: string
          responded_at?: string | null
          score?: number
          score_breakdown?: Json
          scoring_method?: string
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "surplus_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_recipient_organisation_id_fkey"
            columns: ["recipient_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_food_categories: {
        Row: {
          created_at: string
          food_category_id: string
          organisation_id: string
          priority: number
        }
        Insert: {
          created_at?: string
          food_category_id: string
          organisation_id: string
          priority?: number
        }
        Update: {
          created_at?: string
          food_category_id?: string
          organisation_id?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "organisation_food_categories_food_category_id_fkey"
            columns: ["food_category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_food_categories_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_locations: {
        Row: {
          address_line_1: string | null
          city: string
          country: string
          created_at: string
          id: string
          is_primary: boolean
          label: string
          latitude: number
          longitude: number
          organisation_id: string
          postal_code: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["location_visibility"]
        }
        Insert: {
          address_line_1?: string | null
          city: string
          country: string
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string
          latitude: number
          longitude: number
          organisation_id: string
          postal_code?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["location_visibility"]
        }
        Update: {
          address_line_1?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number
          longitude?: number
          organisation_id?: string
          postal_code?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["location_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "organisation_locations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          active_volunteers: number | null
          closes_at: string | null
          created_at: string
          created_by: string | null
          description: string
          donations_this_month: number | null
          governance_score: number | null
          has_refrigeration: boolean
          households_supported: number | null
          id: string
          kind: Database["public"]["Enums"]["organisation_kind"]
          legacy_id: string | null
          name: string
          next_collection_label: string | null
          opening_days: string[]
          opens_at: string | null
          organisation_type: string
          public_profile: boolean
          recipient_capacity_kg: number | null
          reliability_score: number | null
          slug: string
          status: Database["public"]["Enums"]["organisation_status"]
          time_zone: string | null
          updated_at: string
          verified: boolean
          weekly_capacity_kg: number | null
        }
        Insert: {
          active_volunteers?: number | null
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          donations_this_month?: number | null
          governance_score?: number | null
          has_refrigeration?: boolean
          households_supported?: number | null
          id?: string
          kind: Database["public"]["Enums"]["organisation_kind"]
          legacy_id?: string | null
          name: string
          next_collection_label?: string | null
          opening_days?: string[]
          opens_at?: string | null
          organisation_type: string
          public_profile?: boolean
          recipient_capacity_kg?: number | null
          reliability_score?: number | null
          slug: string
          status?: Database["public"]["Enums"]["organisation_status"]
          time_zone?: string | null
          updated_at?: string
          verified?: boolean
          weekly_capacity_kg?: number | null
        }
        Update: {
          active_volunteers?: number | null
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          donations_this_month?: number | null
          governance_score?: number | null
          has_refrigeration?: boolean
          households_supported?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["organisation_kind"]
          legacy_id?: string | null
          name?: string
          next_collection_label?: string | null
          opening_days?: string[]
          opens_at?: string | null
          organisation_type?: string
          public_profile?: boolean
          recipient_capacity_kg?: number | null
          reliability_score?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["organisation_status"]
          time_zone?: string | null
          updated_at?: string
          verified?: boolean
          weekly_capacity_kg?: number | null
        }
        Relationships: []
      }
      surplus_listings: {
        Row: {
          available_from: string
          collected_at: string | null
          collection_deadline: string
          created_at: string
          created_by: string | null
          donor_organisation_id: string
          estimated_meals: number
          food_category_id: string
          handling: Database["public"]["Enums"]["food_handling"]
          id: string
          legacy_id: string | null
          location_id: string
          notes: string
          published_at: string | null
          quantity_kg: number
          recipient_organisation_id: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
        }
        Insert: {
          available_from: string
          collected_at?: string | null
          collection_deadline: string
          created_at?: string
          created_by?: string | null
          donor_organisation_id: string
          estimated_meals?: number
          food_category_id: string
          handling?: Database["public"]["Enums"]["food_handling"]
          id?: string
          legacy_id?: string | null
          location_id: string
          notes?: string
          published_at?: string | null
          quantity_kg: number
          recipient_organisation_id?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
        }
        Update: {
          available_from?: string
          collected_at?: string | null
          collection_deadline?: string
          created_at?: string
          created_by?: string | null
          donor_organisation_id?: string
          estimated_meals?: number
          food_category_id?: string
          handling?: Database["public"]["Enums"]["food_handling"]
          id?: string
          legacy_id?: string | null
          location_id?: string
          notes?: string
          published_at?: string | null
          quantity_kg?: number
          recipient_organisation_id?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surplus_listings_donor_organisation_id_fkey"
            columns: ["donor_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surplus_listings_food_category_id_fkey"
            columns: ["food_category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surplus_listings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "organisation_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surplus_listings_recipient_organisation_id_fkey"
            columns: ["recipient_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          organisation_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          organisation_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organisation_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_collection: {
        Args: { target_collection_id: string }
        Returns: boolean
      }
      can_manage_organisation: {
        Args: { target_organisation_id: string }
        Returns: boolean
      }
      current_user_organisation_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_organisation_member: {
        Args: { target_organisation_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      listing_donor_organisation: {
        Args: { target_listing_id: string }
        Returns: string
      }
      location_belongs_to_organisation: {
        Args: { target_location_id: string; target_organisation_id: string }
        Returns: boolean
      }
    }
    Enums: {
      collection_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "failed"
      food_handling: "ambient" | "chilled" | "frozen"
      listing_status:
        | "draft"
        | "available"
        | "reserved"
        | "collected"
        | "cancelled"
        | "expired"
      location_visibility: "public" | "generalised" | "private"
      match_status:
        | "recommended"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      organisation_kind: "initiative" | "donor" | "recipient" | "hybrid"
      organisation_status: "active" | "pilot" | "seasonal" | "inactive"
      resource_status: "draft" | "published" | "archived"
      user_role:
        | "viewer"
        | "coordinator"
        | "organisation_admin"
        | "platform_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      collection_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "failed",
      ],
      food_handling: ["ambient", "chilled", "frozen"],
      listing_status: [
        "draft",
        "available",
        "reserved",
        "collected",
        "cancelled",
        "expired",
      ],
      location_visibility: ["public", "generalised", "private"],
      match_status: [
        "recommended",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
      ],
      organisation_kind: ["initiative", "donor", "recipient", "hybrid"],
      organisation_status: ["active", "pilot", "seasonal", "inactive"],
      resource_status: ["draft", "published", "archived"],
      user_role: [
        "viewer",
        "coordinator",
        "organisation_admin",
        "platform_admin",
      ],
    },
  },
} as const

