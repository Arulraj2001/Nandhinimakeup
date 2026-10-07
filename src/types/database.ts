export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminRole = "owner" | "editor";

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          user_id: string;
          role: AdminRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: AdminRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AdminRole;
          created_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          storage_path: string;
          file_name: string;
          alt_text: string;
          width: number;
          height: number;
          mime_type: string;
          size_bytes: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          storage_path: string;
          file_name: string;
          alt_text: string;
          width: number;
          height: number;
          mime_type: string;
          size_bytes: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          storage_path?: string;
          file_name?: string;
          alt_text?: string;
          width?: number;
          height?: number;
          mime_type?: string;
          size_bytes?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      seo_pages: {
        Row: {
          id: string;
          path: string;
          title: string;
          description: string;
          og_image_url: string | null;
          canonical_url: string | null;
          noindex: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          title: string;
          description: string;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          path?: string;
          title?: string;
          description?: string;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      redirects: {
        Row: {
          id: string;
          from_path: string;
          to_path: string;
          status_code: 301 | 302;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_path: string;
          to_path: string;
          status_code: 301 | 302;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_path?: string;
          to_path?: string;
          status_code?: 301 | 302;
          created_at?: string;
        };
        Relationships: [];
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          short_description: string;
          long_description: string;
          price_type: "fixed" | "starting_from" | "on_request";
          price: number | null;
          duration_minutes: number | null;
          image_id: string | null;
          includes_list: string[];
          is_featured: boolean;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          short_description?: string;
          long_description?: string;
          price_type: "fixed" | "starting_from" | "on_request";
          price?: number | null;
          duration_minutes?: number | null;
          image_id?: string | null;
          includes_list?: string[];
          is_featured?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          short_description?: string;
          long_description?: string;
          price_type?: "fixed" | "starting_from" | "on_request";
          price?: number | null;
          duration_minutes?: number | null;
          image_id?: string | null;
          includes_list?: string[];
          is_featured?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "service_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_image_id_fkey";
            columns: ["image_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          image_id: string | null;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          image_id?: string | null;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          image_id?: string | null;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_categories_image_id_fkey";
            columns: ["image_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          price: number;
          sale_price: number | null;
          sku: string | null;
          stock_status: "in_stock" | "out_of_stock" | "made_to_order";
          stock_quantity: number | null;
          is_featured: boolean;
          is_new: boolean;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string;
          price: number;
          sale_price?: number | null;
          sku?: string | null;
          stock_status?: "in_stock" | "out_of_stock" | "made_to_order";
          stock_quantity?: number | null;
          is_featured?: boolean;
          is_new?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          price?: number;
          sale_price?: number | null;
          sku?: string | null;
          stock_status?: "in_stock" | "out_of_stock" | "made_to_order";
          stock_quantity?: number | null;
          is_featured?: boolean;
          is_new?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          media_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          media_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          media_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_items: {
        Row: {
          id: string;
          media_id: string;
          before_media_id: string | null;
          type: "single" | "before_after";
          title: string;
          caption: string;
          service_category_id: string | null;
          is_featured: boolean;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          media_id: string;
          before_media_id?: string | null;
          type?: "single" | "before_after";
          title?: string;
          caption?: string;
          service_category_id?: string | null;
          is_featured?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          media_id?: string;
          before_media_id?: string | null;
          type?: "single" | "before_after";
          title?: string;
          caption?: string;
          service_category_id?: string | null;
          is_featured?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_items_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_items_before_media_id_fkey";
            columns: ["before_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_items_service_category_id_fkey";
            columns: ["service_category_id"];
            isOneToOne: false;
            referencedRelation: "service_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      testimonials: {
        Row: {
          id: string;
          customer_name: string;
          occasion: string | null;
          quote: string;
          rating: number;
          source: "google" | "instagram" | "whatsapp" | "direct";
          is_featured: boolean;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          occasion?: string | null;
          quote: string;
          rating: number;
          source: "google" | "instagram" | "whatsapp" | "direct";
          is_featured?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          occasion?: string | null;
          quote?: string;
          rating?: number;
          source?: "google" | "instagram" | "whatsapp" | "direct";
          is_featured?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          group:
            | "general"
            | "services"
            | "jewellery"
            | "orders_and_shipping"
            | "orders and shipping";
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          group:
            | "general"
            | "services"
            | "jewellery"
            | "orders_and_shipping"
            | "orders and shipping";
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          group?:
            | "general"
            | "services"
            | "jewellery"
            | "orders_and_shipping"
            | "orders and shipping";
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          message: string;
          link_url: string | null;
          link_label: string | null;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          link_url?: string | null;
          link_label?: string | null;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          link_url?: string | null;
          link_label?: string | null;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          access_token: string;
          status: string;
          customer_name: string;
          phone: string;
          email: string | null;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          state: string;
          pin_code: string;
          customer_note: string | null;
          subtotal: number;
          delivery_charge: number;
          total: number;
          payment_reference: string | null;
          courier_name: string | null;
          tracking_number: string | null;
          admin_note: string | null;
          stock_restored: boolean;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          access_token: string;
          status?: string;
          customer_name: string;
          phone: string;
          email?: string | null;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          state: string;
          pin_code: string;
          customer_note?: string | null;
          subtotal: number;
          delivery_charge: number;
          total: number;
          payment_reference?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          admin_note?: string | null;
          stock_restored?: boolean;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string;
          access_token?: string;
          status?: string;
          customer_name?: string;
          phone?: string;
          email?: string | null;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          state?: string;
          pin_code?: string;
          customer_note?: string | null;
          subtotal?: number;
          delivery_charge?: number;
          total?: number;
          payment_reference?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          admin_note?: string | null;
          stock_restored?: boolean;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          sku: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          sku?: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          sku?: string | null;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      legal_pages: {
        Row: {
          id: string;
          slug: "privacy-policy" | "terms-and-conditions" | "shipping-and-returns";
          title: string;
          content: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: "privacy-policy" | "terms-and-conditions" | "shipping-and-returns";
          title: string;
          content?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: "privacy-policy" | "terms-and-conditions" | "shipping-and-returns";
          title?: string;
          content?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: Json;
          featured_image_id: string | null;
          category_id: string | null;
          author_name: string;
          status: "draft" | "published";
          published_at: string | null;
          is_featured: boolean;
          reading_time_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: Json;
          featured_image_id?: string | null;
          category_id?: string | null;
          author_name?: string;
          status?: "draft" | "published";
          published_at?: string | null;
          is_featured?: boolean;
          reading_time_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: Json;
          featured_image_id?: string | null;
          category_id?: string | null;
          author_name?: string;
          status?: "draft" | "published";
          published_at?: string | null;
          is_featured?: boolean;
          reading_time_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "blog_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_posts_featured_image_id_fkey";
            columns: ["featured_image_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_order: {
        Args: {
          p_items: Json;
          p_customer_name: string;
          p_phone: string;
          p_email: string | null;
          p_address_line_1: string;
          p_address_line_2: string | null;
          p_city: string;
          p_state: string;
          p_pin_code: string;
          p_customer_note: string | null;
          p_flat_delivery_charge: number;
          p_free_delivery_threshold: number;
          p_order_number_prefix: string;
        };
        Returns: Json;
      };
      cancel_order: {
        Args: {
          p_order_id: string;
          p_cancel_reason?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      admin_role: AdminRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends (PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;
