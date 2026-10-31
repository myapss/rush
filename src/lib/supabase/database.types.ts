export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      ai_events: {
        Row: {
          cost_usd_est: number | null;
          created_at: string;
          feature: Database["public"]["Enums"]["ai_feature"];
          id: number;
          input_tokens: number | null;
          latency_ms: number | null;
          model: string | null;
          output_tokens: number | null;
          status: Database["public"]["Enums"]["ai_event_status"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cost_usd_est?: number | null;
          created_at?: string;
          feature: Database["public"]["Enums"]["ai_feature"];
          id?: never;
          input_tokens?: number | null;
          latency_ms?: number | null;
          model?: string | null;
          output_tokens?: number | null;
          status?: Database["public"]["Enums"]["ai_event_status"];
          user_id: string;
        };
        Update: {
          cost_usd_est?: number | null;
          created_at?: string;
          feature?: Database["public"]["Enums"]["ai_feature"];
          id?: never;
          input_tokens?: number | null;
          latency_ms?: number | null;
          model?: string | null;
          output_tokens?: number | null;
          status?: Database["public"]["Enums"]["ai_event_status"];
          user_id?: string;
        };
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          payload: NonNullable<Json>;
          processed_at: string | null;
          provider: Database["public"]["Enums"]["billing_provider"];
          received_at: string;
          type: string;
        };
        ComputedFields: never;
        Insert: {
          id: string;
          payload: NonNullable<Json>;
          processed_at?: string | null;
          provider: Database["public"]["Enums"]["billing_provider"];
          received_at?: string;
          type: string;
        };
        Update: {
          id?: string;
          payload?: NonNullable<Json>;
          processed_at?: string | null;
          provider?: Database["public"]["Enums"]["billing_provider"];
          received_at?: string;
          type?: string;
        };
        Relationships: [];
      };
      food_items: {
        Row: {
          aliases: string[];
          allergens: Database["public"]["Enums"]["allergen"][];
          carbs_g: number;
          category: string;
          created_at: string;
          dietary_pattern: Database["public"]["Enums"]["dietary_pattern"];
          display_name: string | null;
          extra_nutrients: NonNullable<Json>;
          fat_g: number;
          fdc_id: number | null;
          fibre_g: number | null;
          id: number;
          kcal: number;
          license: string;
          name: string;
          protein_g: number;
          restrictions: Database["public"]["Enums"]["food_restriction"][];
          sat_fat_g: number | null;
          slug: string | null;
          sodium_mg: number | null;
          source_name: string;
          source_reference: string;
          source_updated_at: string;
          sugar_g: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          aliases?: string[];
          allergens?: Database["public"]["Enums"]["allergen"][];
          carbs_g: number;
          category: string;
          created_at?: string;
          dietary_pattern: Database["public"]["Enums"]["dietary_pattern"];
          display_name?: string | null;
          extra_nutrients?: NonNullable<Json>;
          fat_g: number;
          fdc_id?: number | null;
          fibre_g?: number | null;
          id?: never;
          kcal: number;
          license: string;
          name: string;
          protein_g: number;
          restrictions?: Database["public"]["Enums"]["food_restriction"][];
          sat_fat_g?: number | null;
          slug?: string | null;
          sodium_mg?: number | null;
          source_name: string;
          source_reference: string;
          source_updated_at: string;
          sugar_g?: number | null;
          updated_at?: string;
        };
        Update: {
          aliases?: string[];
          allergens?: Database["public"]["Enums"]["allergen"][];
          carbs_g?: number;
          category?: string;
          created_at?: string;
          dietary_pattern?: Database["public"]["Enums"]["dietary_pattern"];
          display_name?: string | null;
          extra_nutrients?: NonNullable<Json>;
          fat_g?: number;
          fdc_id?: number | null;
          fibre_g?: number | null;
          id?: never;
          kcal?: number;
          license?: string;
          name?: string;
          protein_g?: number;
          restrictions?: Database["public"]["Enums"]["food_restriction"][];
          sat_fat_g?: number | null;
          slug?: string | null;
          sodium_mg?: number | null;
          source_name?: string;
          source_reference?: string;
          source_updated_at?: string;
          sugar_g?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      food_portions: {
        Row: {
          amount: number;
          description: string;
          food_item_id: number;
          gram_weight: number;
          id: number;
          unit: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          description: string;
          food_item_id: number;
          gram_weight: number;
          id?: never;
          unit: string;
        };
        Update: {
          amount?: number;
          description?: string;
          food_item_id?: number;
          gram_weight?: number;
          id?: never;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_portions_food_item_id_fkey";
            columns: ["food_item_id"];
            isOneToOne: false;
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
        ];
      };
      grocery_items: {
        Row: {
          category: string;
          checked: boolean;
          food_item_id: number | null;
          grocery_list_id: string;
          id: string;
          name: string;
          position: number;
          quantity: number | null;
          source: string;
          unit: string | null;
        };
        ComputedFields: never;
        Insert: {
          category?: string;
          checked?: boolean;
          food_item_id?: number | null;
          grocery_list_id: string;
          id?: string;
          name: string;
          position?: number;
          quantity?: number | null;
          source?: string;
          unit?: string | null;
        };
        Update: {
          category?: string;
          checked?: boolean;
          food_item_id?: number | null;
          grocery_list_id?: string;
          id?: string;
          name?: string;
          position?: number;
          quantity?: number | null;
          source?: string;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grocery_items_food_item_id_fkey";
            columns: ["food_item_id"];
            isOneToOne: false;
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grocery_items_grocery_list_id_fkey";
            columns: ["grocery_list_id"];
            isOneToOne: false;
            referencedRelation: "grocery_lists";
            referencedColumns: ["id"];
          },
        ];
      };
      grocery_lists: {
        Row: {
          created_at: string;
          household_size: number;
          id: string;
          meal_plan_id: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          household_size?: number;
          id?: string;
          meal_plan_id?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          household_size?: number;
          id?: string;
          meal_plan_id?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grocery_lists_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plans: {
        Row: {
          ai_event_id: number | null;
          created_at: string;
          end_date: string;
          generator: string;
          goal: Database["public"]["Enums"]["goal"];
          id: string;
          start_date: string;
          status: Database["public"]["Enums"]["plan_status"];
          target_kcal: number | null;
          targets_snapshot: NonNullable<Json>;
          title: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          ai_event_id?: number | null;
          created_at?: string;
          end_date: string;
          generator?: string;
          goal: Database["public"]["Enums"]["goal"];
          id?: string;
          start_date: string;
          status?: Database["public"]["Enums"]["plan_status"];
          target_kcal?: number | null;
          targets_snapshot?: NonNullable<Json>;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_event_id?: number | null;
          created_at?: string;
          end_date?: string;
          generator?: string;
          goal?: Database["public"]["Enums"]["goal"];
          id?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["plan_status"];
          target_kcal?: number | null;
          targets_snapshot?: NonNullable<Json>;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plans_ai_event_id_fkey";
            columns: ["ai_event_id"];
            isOneToOne: false;
            referencedRelation: "ai_events";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_limits: {
        Row: {
          feature: Database["public"]["Enums"]["ai_feature"];
          monthly_limit: number;
          tier: string;
        };
        ComputedFields: never;
        Insert: {
          feature: Database["public"]["Enums"]["ai_feature"];
          monthly_limit: number;
          tier: string;
        };
        Update: {
          feature?: Database["public"]["Enums"]["ai_feature"];
          monthly_limit?: number;
          tier?: string;
        };
        Relationships: [];
      };
      planned_meals: {
        Row: {
          date: string;
          id: string;
          meal_plan_id: string;
          meal_type: Database["public"]["Enums"]["meal_type"];
          nutrition_snapshot: NonNullable<Json>;
          position: number;
          recipe_id: string | null;
          recipe_title: string;
          servings: number;
          slot: number;
        };
        ComputedFields: never;
        Insert: {
          date: string;
          id?: string;
          meal_plan_id: string;
          meal_type: Database["public"]["Enums"]["meal_type"];
          nutrition_snapshot: NonNullable<Json>;
          position?: number;
          recipe_id?: string | null;
          recipe_title: string;
          servings: number;
          slot?: number;
        };
        Update: {
          date?: string;
          id?: string;
          meal_plan_id?: string;
          meal_type?: Database["public"]["Enums"]["meal_type"];
          nutrition_snapshot?: NonNullable<Json>;
          position?: number;
          recipe_id?: string | null;
          recipe_title?: string;
          servings?: number;
          slot?: number;
        };
        Relationships: [
          {
            foreignKeyName: "planned_meals_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "planned_meals_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          birth_year: number | null;
          country: string | null;
          created_at: string;
          currency: string | null;
          display_name: string | null;
          health_data_consent_at: string | null;
          health_flags: NonNullable<Json>;
          height_cm: number | null;
          id: string;
          measurement_unit: Database["public"]["Enums"]["measurement_unit"];
          onboarding_completed_at: string | null;
          preferred_language: string;
          sex_for_calc: Database["public"]["Enums"]["sex_for_calc"] | null;
          updated_at: string;
          weight_kg: number | null;
        };
        ComputedFields: never;
        Insert: {
          birth_year?: number | null;
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          display_name?: string | null;
          health_data_consent_at?: string | null;
          health_flags?: NonNullable<Json>;
          height_cm?: number | null;
          id: string;
          measurement_unit?: Database["public"]["Enums"]["measurement_unit"];
          onboarding_completed_at?: string | null;
          preferred_language?: string;
          sex_for_calc?: Database["public"]["Enums"]["sex_for_calc"] | null;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Update: {
          birth_year?: number | null;
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          display_name?: string | null;
          health_data_consent_at?: string | null;
          health_flags?: NonNullable<Json>;
          height_cm?: number | null;
          id?: string;
          measurement_unit?: Database["public"]["Enums"]["measurement_unit"];
          onboarding_completed_at?: string | null;
          preferred_language?: string;
          sex_for_calc?: Database["public"]["Enums"]["sex_for_calc"] | null;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      progress_entries: {
        Row: {
          adherence_pct: number | null;
          created_at: string;
          entry_date: string;
          id: string;
          measurements: NonNullable<Json>;
          notes: string | null;
          updated_at: string;
          user_id: string;
          waist_cm: number | null;
          weight_kg: number | null;
        };
        ComputedFields: never;
        Insert: {
          adherence_pct?: number | null;
          created_at?: string;
          entry_date: string;
          id?: string;
          measurements?: NonNullable<Json>;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
          waist_cm?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          adherence_pct?: number | null;
          created_at?: string;
          entry_date?: string;
          id?: string;
          measurements?: NonNullable<Json>;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
          waist_cm?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          count: number;
          key: string;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          count?: number;
          key: string;
          window_start: string;
        };
        Update: {
          count?: number;
          key?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          food_item_id: number;
          grams: number;
          id: number;
          position: number;
          preparation_note: string | null;
          quantity: number;
          recipe_id: string;
          unit: string;
        };
        ComputedFields: never;
        Insert: {
          food_item_id: number;
          grams: number;
          id?: never;
          position?: number;
          preparation_note?: string | null;
          quantity: number;
          recipe_id: string;
          unit: string;
        };
        Update: {
          food_item_id?: number;
          grams?: number;
          id?: never;
          position?: number;
          preparation_note?: string | null;
          quantity?: number;
          recipe_id?: string;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_food_item_id_fkey";
            columns: ["food_item_id"];
            isOneToOne: false;
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipes: {
        Row: {
          allergen_tags: Database["public"]["Enums"]["allergen"][];
          cook_minutes: number;
          cost_tier: number | null;
          created_at: string;
          created_by: string | null;
          cuisine: string | null;
          description: string | null;
          dietary_pattern: Database["public"]["Enums"]["dietary_pattern"];
          id: string;
          instructions: string[];
          meal_types: Database["public"]["Enums"]["meal_type"][];
          nutrition_per_serving: NonNullable<Json>;
          origin: Database["public"]["Enums"]["recipe_origin"];
          prep_minutes: number;
          restriction_tags: Database["public"]["Enums"]["food_restriction"][];
          review_status: string;
          servings: number;
          slug: string | null;
          title: string;
          updated_at: string;
          visibility: Database["public"]["Enums"]["recipe_visibility"];
        };
        ComputedFields: never;
        Insert: {
          allergen_tags?: Database["public"]["Enums"]["allergen"][];
          cook_minutes?: number;
          cost_tier?: number | null;
          created_at?: string;
          created_by?: string | null;
          cuisine?: string | null;
          description?: string | null;
          dietary_pattern?: Database["public"]["Enums"]["dietary_pattern"];
          id?: string;
          instructions?: string[];
          meal_types?: Database["public"]["Enums"]["meal_type"][];
          nutrition_per_serving?: NonNullable<Json>;
          origin: Database["public"]["Enums"]["recipe_origin"];
          prep_minutes?: number;
          restriction_tags?: Database["public"]["Enums"]["food_restriction"][];
          review_status?: string;
          servings: number;
          slug?: string | null;
          title: string;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["recipe_visibility"];
        };
        Update: {
          allergen_tags?: Database["public"]["Enums"]["allergen"][];
          cook_minutes?: number;
          cost_tier?: number | null;
          created_at?: string;
          created_by?: string | null;
          cuisine?: string | null;
          description?: string | null;
          dietary_pattern?: Database["public"]["Enums"]["dietary_pattern"];
          id?: string;
          instructions?: string[];
          meal_types?: Database["public"]["Enums"]["meal_type"][];
          nutrition_per_serving?: NonNullable<Json>;
          origin?: Database["public"]["Enums"]["recipe_origin"];
          prep_minutes?: number;
          restriction_tags?: Database["public"]["Enums"]["food_restriction"][];
          review_status?: string;
          servings?: number;
          slug?: string | null;
          title?: string;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["recipe_visibility"];
        };
        Relationships: [];
      };
      saved_recipes: {
        Row: {
          created_at: string;
          recipe_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          recipe_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          recipe_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_recipes_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          created_at: string;
          currency: string | null;
          current_period_end: string | null;
          id: string;
          last_event_at: string | null;
          plan: Database["public"]["Enums"]["billing_plan"];
          price_id: string | null;
          provider: Database["public"]["Enums"]["billing_provider"];
          provider_customer_id: string;
          provider_subscription_id: string;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          currency?: string | null;
          current_period_end?: string | null;
          id?: string;
          last_event_at?: string | null;
          plan: Database["public"]["Enums"]["billing_plan"];
          price_id?: string | null;
          provider: Database["public"]["Enums"]["billing_provider"];
          provider_customer_id: string;
          provider_subscription_id: string;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          currency?: string | null;
          current_period_end?: string | null;
          id?: string;
          last_event_at?: string | null;
          plan?: Database["public"]["Enums"]["billing_plan"];
          price_id?: string | null;
          provider?: Database["public"]["Enums"]["billing_provider"];
          provider_customer_id?: string;
          provider_subscription_id?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"];
          allergies: Database["public"]["Enums"]["allergen"][];
          budget_amount: number | null;
          budget_period: string | null;
          cooking_skill: string;
          created_at: string;
          dietary_pattern: Database["public"]["Enums"]["dietary_pattern"];
          disliked_foods: string[];
          equipment: string[];
          food_restrictions: Database["public"]["Enums"]["food_restriction"][];
          goal: Database["public"]["Enums"]["goal"];
          id: string;
          include_snacks: boolean;
          liked_foods: string[];
          max_cook_minutes: number | null;
          meals_per_day: number;
          other_preferences: NonNullable<Json>;
          preferred_cuisines: string[];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"];
          allergies?: Database["public"]["Enums"]["allergen"][];
          budget_amount?: number | null;
          budget_period?: string | null;
          cooking_skill?: string;
          created_at?: string;
          dietary_pattern?: Database["public"]["Enums"]["dietary_pattern"];
          disliked_foods?: string[];
          equipment?: string[];
          food_restrictions?: Database["public"]["Enums"]["food_restriction"][];
          goal?: Database["public"]["Enums"]["goal"];
          id?: string;
          include_snacks?: boolean;
          liked_foods?: string[];
          max_cook_minutes?: number | null;
          meals_per_day?: number;
          other_preferences?: NonNullable<Json>;
          preferred_cuisines?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"];
          allergies?: Database["public"]["Enums"]["allergen"][];
          budget_amount?: number | null;
          budget_period?: string | null;
          cooking_skill?: string;
          created_at?: string;
          dietary_pattern?: Database["public"]["Enums"]["dietary_pattern"];
          disliked_foods?: string[];
          equipment?: string[];
          food_restrictions?: Database["public"]["Enums"]["food_restriction"][];
          goal?: Database["public"]["Enums"]["goal"];
          id?: string;
          include_snacks?: boolean;
          liked_foods?: string[];
          max_cook_minutes?: number | null;
          meals_per_day?: number;
          other_preferences?: NonNullable<Json>;
          preferred_cuisines?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      consume_quota: {
        Args: { p_feature: Database["public"]["Enums"]["ai_feature"] };
        Returns: number;
      };
      has_health_consent: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_premium: { Args: { uid: string }; Returns: boolean };
      metrics_summary: { Args: { p_days?: number }; Returns: Json };
      my_tier: { Args: Record<PropertyKey, never>; Returns: string };
      prune_old_data: { Args: Record<PropertyKey, never>; Returns: undefined };
      quota_status: {
        Args: { p_feature: Database["public"]["Enums"]["ai_feature"] };
        Returns: {
          monthly_limit: number;
          resets_at: string;
          tier: string;
          used: number;
        }[];
      };
      text_array_ok: {
        Args: { arr: string[]; max_items: number; max_len: number };
        Returns: boolean;
      };
    };
    Enums: {
      activity_level:
        "sedentary" | "light" | "moderate" | "very_active" | "athlete";
      ai_event_status: "pending" | "ok" | "fallback" | "invalid" | "error";
      ai_feature: "meal_plan" | "recipe" | "substitution";
      allergen:
        | "gluten"
        | "dairy"
        | "egg"
        | "peanut"
        | "tree_nut"
        | "soy"
        | "fish"
        | "shellfish"
        | "sesame"
        | "mustard"
        | "celery"
        | "lupin"
        | "mollusc"
        | "sulphite";
      billing_plan: "premium_monthly" | "premium_yearly";
      billing_provider: "paddle" | "stripe";
      dietary_pattern: "vegan" | "vegetarian" | "pescatarian" | "omnivore";
      food_restriction: "pork" | "beef" | "alcohol";
      goal: "lose" | "maintain" | "gain" | "healthier";
      meal_type: "breakfast" | "lunch" | "dinner" | "snack";
      measurement_unit: "metric" | "imperial";
      plan_status: "draft" | "active" | "archived";
      recipe_origin: "curated" | "ai_generated" | "user";
      recipe_visibility: "public" | "private";
      sex_for_calc: "female" | "male" | "unspecified";
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "paused"
        | "canceled"
        | "incomplete";
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "very_active",
        "athlete",
      ],
      ai_event_status: ["pending", "ok", "fallback", "invalid", "error"],
      ai_feature: ["meal_plan", "recipe", "substitution"],
      allergen: [
        "gluten",
        "dairy",
        "egg",
        "peanut",
        "tree_nut",
        "soy",
        "fish",
        "shellfish",
        "sesame",
        "mustard",
        "celery",
        "lupin",
        "mollusc",
        "sulphite",
      ],
      billing_plan: ["premium_monthly", "premium_yearly"],
      billing_provider: ["paddle", "stripe"],
      dietary_pattern: ["vegan", "vegetarian", "pescatarian", "omnivore"],
      food_restriction: ["pork", "beef", "alcohol"],
      goal: ["lose", "maintain", "gain", "healthier"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      measurement_unit: ["metric", "imperial"],
      plan_status: ["draft", "active", "archived"],
      recipe_origin: ["curated", "ai_generated", "user"],
      recipe_visibility: ["public", "private"],
      sex_for_calc: ["female", "male", "unspecified"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "paused",
        "canceled",
        "incomplete",
      ],
    },
  },
} as const;
