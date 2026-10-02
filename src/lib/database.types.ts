// File ini di-generate dari skema Supabase — jangan diedit manual.
// Setelah menambah migrasi Prisma, generate ulang:
//   npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      Image: {
        Row: {
          createdAt: string
          height: number
          id: string
          kind: Database["public"]["Enums"]["ImageKind"]
          path: string
          size: number
          tripId: string | null
          width: number
        }
        Insert: {
          createdAt?: string
          height: number
          id?: string
          kind: Database["public"]["Enums"]["ImageKind"]
          path: string
          size: number
          tripId?: string | null
          width: number
        }
        Update: {
          createdAt?: string
          height?: number
          id?: string
          kind?: Database["public"]["Enums"]["ImageKind"]
          path?: string
          size?: number
          tripId?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "Image_tripId_fkey"
            columns: ["tripId"]
            isOneToOne: false
            referencedRelation: "Trip"
            referencedColumns: ["id"]
          },
        ]
      }
      Order: {
        Row: {
          createdAt: string
          id: string
          isPaid: boolean
          items: string
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"]
          price: number | null
          proofId: string | null
          tripId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          isPaid?: boolean
          items: string
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"]
          price?: number | null
          proofId?: string | null
          tripId: string
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          isPaid?: boolean
          items?: string
          paymentMethod?: Database["public"]["Enums"]["PaymentMethod"]
          price?: number | null
          proofId?: string | null
          tripId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Order_proofId_fkey"
            columns: ["proofId"]
            isOneToOne: false
            referencedRelation: "Image"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_tripId_fkey"
            columns: ["tripId"]
            isOneToOne: false
            referencedRelation: "Trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Setting: {
        Row: {
          key: string
          updatedAt: string
          value: string
        }
        Insert: {
          key: string
          updatedAt?: string
          value: string
        }
        Update: {
          key?: string
          updatedAt?: string
          value?: string
        }
        Relationships: []
      }
      Trip: {
        Row: {
          closesAt: string | null
          createdAt: string
          hostId: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["TripStatus"]
          title: string
          updatedAt: string
        }
        Insert: {
          closesAt?: string | null
          createdAt?: string
          hostId: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["TripStatus"]
          title: string
          updatedAt?: string
        }
        Update: {
          closesAt?: string | null
          createdAt?: string
          hostId?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["TripStatus"]
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Trip_hostId_fkey"
            columns: ["hostId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          avatarId: string | null
          createdAt: string
          id: string
          isActive: boolean
          name: string
          paymentInfo: string | null
          paymentQrId: string | null
          pinFailedCount: number
          pinHash: string | null
          pinLockedUntil: string | null
          sessionVersion: number
          showWhenInactive: boolean
          updatedAt: string
        }
        Insert: {
          avatarId?: string | null
          createdAt?: string
          id?: string
          isActive?: boolean
          name: string
          paymentInfo?: string | null
          paymentQrId?: string | null
          pinFailedCount?: number
          pinHash?: string | null
          pinLockedUntil?: string | null
          sessionVersion?: number
          showWhenInactive?: boolean
          updatedAt?: string
        }
        Update: {
          avatarId?: string | null
          createdAt?: string
          id?: string
          isActive?: boolean
          name?: string
          paymentInfo?: string | null
          paymentQrId?: string | null
          pinFailedCount?: number
          pinHash?: string | null
          pinLockedUntil?: string | null
          sessionVersion?: number
          showWhenInactive?: boolean
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_avatarId_fkey"
            columns: ["avatarId"]
            isOneToOne: false
            referencedRelation: "Image"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User_paymentQrId_fkey"
            columns: ["paymentQrId"]
            isOneToOne: false
            referencedRelation: "Image"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ImageKind: "AVATAR" | "PAYMENT_QR" | "PROOF" | "TRIP"
      PaymentMethod: "CASH" | "CASHLESS"
      TripStatus: "OPEN" | "CLOSED" | "DONE"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      ImageKind: ["AVATAR", "PAYMENT_QR", "PROOF", "TRIP"],
      PaymentMethod: ["CASH", "CASHLESS"],
      TripStatus: ["OPEN", "CLOSED", "DONE"],
    },
  },
} as const
