export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string;
          shop_name: string;
          owner_name: string | null;
          phone: string;
          google_maps_url: string | null;
          slug: string;
          latitude: number | null;
          longitude: number | null;
          customer_count: number;
          plan: "TRIAL" | "STARTER" | "GROWTH" | "PRO";
          subscription_status: "ACTIVE" | "EXPIRED" | "CANCELLED";
          trial_started_at: string;
          trial_ends_at: string;
          subscription_started_at: string | null;
          subscription_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          shop_name: string;
          owner_name?: string | null;
          phone: string;
          google_maps_url?: string | null;
          slug: string;
          latitude?: number | null;
          longitude?: number | null;
          customer_count?: number;
          plan?: "TRIAL" | "STARTER" | "GROWTH" | "PRO";
          subscription_status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
          trial_started_at?: string;
          trial_ends_at?: string;
          subscription_started_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_name?: string;
          owner_name?: string | null;
          phone?: string;
          google_maps_url?: string | null;
          slug?: string;
          latitude?: number | null;
          longitude?: number | null;
          customer_count?: number;
          plan?: "TRIAL" | "STARTER" | "GROWTH" | "PRO";
          subscription_status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
          trial_started_at?: string;
          trial_ends_at?: string;
          subscription_started_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          phone: string;
          visit_count: number;
          first_visit_at: string;
          last_visit_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          name: string;
          phone: string;
          visit_count?: number;
          first_visit_at?: string;
          last_visit_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          name?: string;
          phone?: string;
          visit_count?: number;
          first_visit_at?: string;
          last_visit_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          }
        ];
      };
      rewards: {
        Row: {
          id: string;
          merchant_id: string;
          customer_id: string;
          reward_type: string;
          title: string;
          description: string | null;
          discount_value: string | null;
          status: "ACTIVE" | "REDEEMED" | "EXPIRED";
          reference_code: string;
          issued_at: string;
          redeemed_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_id: string;
          reward_type?: string;
          title: string;
          description?: string | null;
          discount_value?: string | null;
          status?: "ACTIVE" | "REDEEMED" | "EXPIRED";
          reference_code: string;
          issued_at?: string;
          redeemed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_id?: string;
          reward_type?: string;
          title?: string;
          description?: string | null;
          discount_value?: string | null;
          status?: "ACTIVE" | "REDEEMED" | "EXPIRED";
          reference_code?: string;
          issued_at?: string;
          redeemed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rewards_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      customer_visits: {
        Row: {
          id: string;
          merchant_id: string;
          customer_id: string;
          visit_type: "FIRST_VISIT" | "REPEAT_VISIT";
          visited_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_id: string;
          visit_type?: "FIRST_VISIT" | "REPEAT_VISIT";
          visited_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_id?: string;
          visit_type?: "FIRST_VISIT" | "REPEAT_VISIT";
          visited_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_visits_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_visits_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      offers: {
        Row: {
          id: string;
          merchant_id: string;
          title: string;
          message: string;
          image_url: string | null;
          status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
          start_at: string | null;
          end_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          title: string;
          message: string;
          image_url?: string | null;
          status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
          start_at?: string | null;
          end_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          title?: string;
          message?: string;
          image_url?: string | null;
          status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
          start_at?: string | null;
          end_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          }
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          merchant_id: string;
          customer_id: string;
          token: string;
          platform: string;
          is_valid: boolean;
          created_at: string;
          updated_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_id: string;
          token: string;
          platform?: string;
          is_valid?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_id?: string;
          token?: string;
          platform?: string;
          is_valid?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "push_tokens_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      notification_logs: {
        Row: {
          id: string;
          offer_id: string | null;
          merchant_id: string;
          customer_id: string | null;
          token: string;
          status: "SENT" | "FAILED" | "INVALID_TOKEN";
          provider_message_id: string | null;
          error_message: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          offer_id?: string | null;
          merchant_id: string;
          customer_id?: string | null;
          token: string;
          status: "SENT" | "FAILED" | "INVALID_TOKEN";
          provider_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string;
        };
        Update: {
          id?: string;
          offer_id?: string | null;
          merchant_id?: string;
          customer_id?: string | null;
          token?: string;
          status?: "SENT" | "FAILED" | "INVALID_TOKEN";
          provider_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_logs_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_logs_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_logs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      nearby_offer_logs: {
        Row: {
          id: string;
          merchant_id: string;
          customer_id: string;
          offer_id: string | null;
          distance_meters: number | null;
          triggered_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_id: string;
          offer_id?: string | null;
          distance_meters?: number | null;
          triggered_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_id?: string;
          offer_id?: string | null;
          distance_meters?: number | null;
          triggered_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nearby_offer_logs_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "nearby_offer_logs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "nearby_offer_logs_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          }
        ];
      };
      scratch_card_rewards: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          description: string | null;
          value: string;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          name: string;
          description?: string | null;
          value: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          name?: string;
          description?: string | null;
          value?: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scratch_card_rewards_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          }
        ];
      };
      review_requests: {
        Row: {
          id: string;
          merchant_id: string;
          customer_id: string;
          review_url: string | null;
          scheduled_at: string;
          status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_id: string;
          review_url?: string | null;
          scheduled_at: string;
          status?: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_id?: string;
          review_url?: string | null;
          scheduled_at?: string;
          status?: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_requests_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_requests_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Merchant = Database["public"]["Tables"]["merchants"]["Row"];
export type MerchantInsert = Database["public"]["Tables"]["merchants"]["Insert"];
export type MerchantUpdate = Database["public"]["Tables"]["merchants"]["Update"];

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
export type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

export type Reward = Database["public"]["Tables"]["rewards"]["Row"];
export type RewardInsert = Database["public"]["Tables"]["rewards"]["Insert"];
export type RewardUpdate = Database["public"]["Tables"]["rewards"]["Update"];

export type ScratchCardReward = Database["public"]["Tables"]["scratch_card_rewards"]["Row"];
export type ScratchCardRewardInsert = Database["public"]["Tables"]["scratch_card_rewards"]["Insert"];
export type ScratchCardRewardUpdate = Database["public"]["Tables"]["scratch_card_rewards"]["Update"];

export type ReviewRequest = Database["public"]["Tables"]["review_requests"]["Row"];
export type ReviewRequestInsert = Database["public"]["Tables"]["review_requests"]["Insert"];
export type ReviewRequestUpdate = Database["public"]["Tables"]["review_requests"]["Update"];

export type CustomerVisit = Database["public"]["Tables"]["customer_visits"]["Row"];
export type CustomerVisitInsert = Database["public"]["Tables"]["customer_visits"]["Insert"];

export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type OfferInsert = Database["public"]["Tables"]["offers"]["Insert"];
export type OfferUpdate = Database["public"]["Tables"]["offers"]["Update"];

export type PushToken = Database["public"]["Tables"]["push_tokens"]["Row"];
export type PushTokenInsert = Database["public"]["Tables"]["push_tokens"]["Insert"];
export type PushTokenUpdate = Database["public"]["Tables"]["push_tokens"]["Update"];

export type NotificationLog = Database["public"]["Tables"]["notification_logs"]["Row"];
export type NotificationLogInsert = Database["public"]["Tables"]["notification_logs"]["Insert"];

export type NearbyOfferLog = Database["public"]["Tables"]["nearby_offer_logs"]["Row"];
export type NearbyOfferLogInsert = Database["public"]["Tables"]["nearby_offer_logs"]["Insert"];

export interface ShopPublicProfile {
  id: string;
  shop_name: string;
  owner_name: string | null;
  phone: string;
  google_maps_url: string | null;
  slug: string;
  latitude?: number | null;
  longitude?: number | null;
}


