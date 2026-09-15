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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contenidos: {
        Row: {
          creado_en: string
          detalle: string
          fecha: string | null
          fijado: boolean
          id: string
          iglesia_id: string
          imagen: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          creado_en?: string
          detalle?: string
          fecha?: string | null
          fijado?: boolean
          id?: string
          iglesia_id: string
          imagen?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          creado_en?: string
          detalle?: string
          fecha?: string | null
          fijado?: boolean
          id?: string
          iglesia_id?: string
          imagen?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "contenidos_iglesia_id_fkey"
            columns: ["iglesia_id"]
            isOneToOne: false
            referencedRelation: "iglesias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenidos_iglesia_id_fkey"
            columns: ["iglesia_id"]
            isOneToOne: false
            referencedRelation: "iglesias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      iglesias: {
        Row: {
          admin_uid: string | null
          codigo_acceso: string
          color: string
          creado_en: string
          email_admin: string
          email_contacto: string
          id: string
          links: Json
          logo: string
          nombre: string
          pastor_foto: string
          pastor_nombre: string
          slug: string
        }
        Insert: {
          admin_uid?: string | null
          codigo_acceso: string
          color?: string
          creado_en?: string
          email_admin: string
          email_contacto?: string
          id?: string
          links?: Json
          logo?: string
          nombre: string
          pastor_foto?: string
          pastor_nombre?: string
          slug: string
        }
        Update: {
          admin_uid?: string | null
          codigo_acceso?: string
          color?: string
          creado_en?: string
          email_admin?: string
          email_contacto?: string
          id?: string
          links?: Json
          logo?: string
          nombre?: string
          pastor_foto?: string
          pastor_nombre?: string
          slug?: string
        }
        Relationships: []
      }
      miembros: {
        Row: {
          email: string
          fecha_registro: string
          id: string
          iglesia_id: string
          nombre: string
          rol: string
          user_id: string | null
        }
        Insert: {
          email: string
          fecha_registro?: string
          id?: string
          iglesia_id: string
          nombre: string
          rol?: string
          user_id?: string | null
        }
        Update: {
          email?: string
          fecha_registro?: string
          id?: string
          iglesia_id?: string
          nombre?: string
          rol?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "miembros_iglesia_id_fkey"
            columns: ["iglesia_id"]
            isOneToOne: false
            referencedRelation: "iglesias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miembros_iglesia_id_fkey"
            columns: ["iglesia_id"]
            isOneToOne: false
            referencedRelation: "iglesias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          contenido_id: string
          creada_en: string
          detalle: string
          id: string
          iglesia_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          contenido_id: string
          creada_en?: string
          detalle?: string
          id?: string
          iglesia_id: string
          tipo?: string
          titulo: string
        }
        Update: {
          contenido_id?: string
          creada_en?: string
          detalle?: string
          id?: string
          iglesia_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          creado_en: string
          email: string
          id: string
          iglesia_id: string | null
          nombre: string
          rol: string
        }
        Insert: {
          creado_en?: string
          email: string
          id: string
          iglesia_id?: string | null
          nombre?: string
          rol?: string
        }
        Update: {
          creado_en?: string
          email?: string
          id?: string
          iglesia_id?: string | null
          nombre?: string
          rol?: string
        }
        Relationships: []
      }
    }
    Views: {
      iglesias_publicas: {
        Row: {
          color: string | null
          creado_en: string | null
          id: string | null
          links: Json | null
          logo: string | null
          nombre: string | null
          pastor_foto: string | null
          pastor_nombre: string | null
          slug: string | null
        }
        Insert: {
          color?: string | null
          creado_en?: string | null
          id?: string | null
          links?: Json | null
          logo?: string | null
          nombre?: string | null
          pastor_foto?: string | null
          pastor_nombre?: string | null
          slug?: string | null
        }
        Update: {
          color?: string | null
          creado_en?: string | null
          id?: string | null
          links?: Json | null
          logo?: string | null
          nombre?: string | null
          pastor_foto?: string | null
          pastor_nombre?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      codigo_valido: {
        Args: { _codigo: string; _slug: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
