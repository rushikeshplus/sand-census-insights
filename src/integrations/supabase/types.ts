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
      Cencus_2011: {
        Row: {
          District: number | null
          EB: number | null
          F_ILL: number | null
          F_LIT: number | null
          Level: string | null
          M_ILL: number | null
          M_LIT: number | null
          MAINWORK_F: number | null
          MAINWORK_M: number | null
          MAINWORK_P: number | null
          Name: string | null
          No_HH: number | null
          P_ILL: number | null
          P_LIT: number | null
          State: number | null
          Subdistt: number | null
          TOT_F: number | null
          TOT_M: number | null
          TOT_P: number | null
          TOT_WORK_F: number | null
          TOT_WORK_M: number | null
          TOT_WORK_P: number | null
          "Town/Village": number
          TRU: string | null
          Ward: number | null
        }
        Insert: {
          District?: number | null
          EB?: number | null
          F_ILL?: number | null
          F_LIT?: number | null
          Level?: string | null
          M_ILL?: number | null
          M_LIT?: number | null
          MAINWORK_F?: number | null
          MAINWORK_M?: number | null
          MAINWORK_P?: number | null
          Name?: string | null
          No_HH?: number | null
          P_ILL?: number | null
          P_LIT?: number | null
          State?: number | null
          Subdistt?: number | null
          TOT_F?: number | null
          TOT_M?: number | null
          TOT_P?: number | null
          TOT_WORK_F?: number | null
          TOT_WORK_M?: number | null
          TOT_WORK_P?: number | null
          "Town/Village": number
          TRU?: string | null
          Ward?: number | null
        }
        Update: {
          District?: number | null
          EB?: number | null
          F_ILL?: number | null
          F_LIT?: number | null
          Level?: string | null
          M_ILL?: number | null
          M_LIT?: number | null
          MAINWORK_F?: number | null
          MAINWORK_M?: number | null
          MAINWORK_P?: number | null
          Name?: string | null
          No_HH?: number | null
          P_ILL?: number | null
          P_LIT?: number | null
          State?: number | null
          Subdistt?: number | null
          TOT_F?: number | null
          TOT_M?: number | null
          TOT_P?: number | null
          TOT_WORK_F?: number | null
          TOT_WORK_M?: number | null
          TOT_WORK_P?: number | null
          "Town/Village"?: number
          TRU?: string | null
          Ward?: number | null
        }
        Relationships: []
      }
      Darpan_NGO: {
        Row: {
          Address: string | null
          District: string | null
          "Name of NPO": string | null
          "Reg no": string | null
          "Registration No, District (State)": string | null
          "Sectors working in": string | null
          State: string | null
          Type: string | null
        }
        Insert: {
          Address?: string | null
          District?: string | null
          "Name of NPO"?: string | null
          "Reg no"?: string | null
          "Registration No, District (State)"?: string | null
          "Sectors working in"?: string | null
          State?: string | null
          Type?: string | null
        }
        Update: {
          Address?: string | null
          District?: string | null
          "Name of NPO"?: string | null
          "Reg no"?: string | null
          "Registration No, District (State)"?: string | null
          "Sectors working in"?: string | null
          State?: string | null
          Type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
