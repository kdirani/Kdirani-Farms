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
      profiles: {
        Row: {
          id: string
          fname: string
          user_role: 'admin' | 'sub_admin' | 'farmer'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          fname: string
          user_role?: 'admin' | 'sub_admin' | 'farmer'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          fname?: string
          user_role?: 'admin' | 'sub_admin' | 'farmer'
          created_at?: string
          updated_at?: string | null
        }
      }
      egg_weights: {
        Row: {
          id: string
          weight_range: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          weight_range: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          weight_range?: string
          created_at?: string
          updated_at?: string
        }
      }
      materials_names: {
        Row: {
          id: string
          material_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          material_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          material_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      measurement_units: {
        Row: {
          id: string
          unit_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      expense_types: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      medicines: {
        Row: {
          id: string
          name: string
          description: string | null
          day_of_age: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          day_of_age: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          day_of_age?: string
          created_at?: string
          updated_at?: string
        }
      }
      farms: {
        Row: {
          id: string
          user_id: string | null
          name: string
          location: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          location?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          location?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      warehouses: {
        Row: {
          id: string
          farm_id: string | null
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farm_id?: string | null
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farm_id?: string | null
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          warehouse_id: string | null
          material_name_id: string | null
          unit_id: string | null
          opening_balance: number
          purchases: number
          sales: number
          consumption: number
          manufacturing: number
          current_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          warehouse_id?: string | null
          material_name_id?: string | null
          unit_id?: string | null
          opening_balance?: number
          purchases?: number
          sales?: number
          consumption?: number
          manufacturing?: number
          current_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          warehouse_id?: string | null
          material_name_id?: string | null
          unit_id?: string | null
          opening_balance?: number
          purchases?: number
          sales?: number
          consumption?: number
          manufacturing?: number
          current_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      poultry_status: {
        Row: {
          id: string
          farm_id: string | null
          batch_name: string | null
          opening_chicks: number
          dead_chicks: number
          remaining_chicks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farm_id?: string | null
          batch_name?: string | null
          opening_chicks?: number
          dead_chicks?: number
          remaining_chicks?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farm_id?: string | null
          batch_name?: string | null
          opening_chicks?: number
          dead_chicks?: number
          remaining_chicks?: number
          created_at?: string
          updated_at?: string
        }
      }
      daily_reports: {
        Row: {
          id: string
          warehouse_id: string | null
          report_date: string
          report_time: string
          production_eggs_healthy: number
          production_eggs_deformed: number
          production_eggs: number
          production_egg_rate: number
          eggs_sold: number
          eggs_gift: number
          previous_eggs_balance: number
          current_eggs_balance: number
          carton_consumption: number
          chicks_before: number
          chicks_dead: number
          chicks_after: number
          feed_daily_kg: number
          feed_monthly_kg: number
          feed_ratio: number
          production_droppings: number
          notes: string | null
          checked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          warehouse_id?: string | null
          report_date: string
          report_time: string
          production_eggs_healthy?: number
          production_eggs_deformed?: number
          production_eggs?: number
          production_egg_rate?: number
          eggs_sold?: number
          eggs_gift?: number
          previous_eggs_balance?: number
          current_eggs_balance?: number
          carton_consumption?: number
          chicks_before?: number
          chicks_dead?: number
          chicks_after?: number
          feed_daily_kg?: number
          feed_monthly_kg?: number
          feed_ratio?: number
          production_droppings?: number
          notes?: string | null
          checked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          warehouse_id?: string | null
          report_date?: string
          report_time?: string
          production_eggs_healthy?: number
          production_eggs_deformed?: number
          production_eggs?: number
          production_egg_rate?: number
          eggs_sold?: number
          eggs_gift?: number
          previous_eggs_balance?: number
          current_eggs_balance?: number
          carton_consumption?: number
          chicks_before?: number
          chicks_dead?: number
          chicks_after?: number
          feed_daily_kg?: number
          feed_monthly_kg?: number
          feed_ratio?: number
          production_droppings?: number
          notes?: string | null
          checked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_report_attachments: {
        Row: {
          id: string
          report_id: string | null
          file_url: string | null
          file_name: string | null
          file_type: string | null
        }
        Insert: {
          id?: string
          report_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: string | null
        }
        Update: {
          id?: string
          report_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          type: 'customer' | 'provider'
        }
        Insert: {
          id?: string
          name: string
          type: 'customer' | 'provider'
        }
        Update: {
          id?: string
          name?: string
          type?: 'customer' | 'provider'
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_type: 'buy' | 'sell' | null
          invoice_date: string
          invoice_time: string | null
          invoice_number: string
          warehouse_id: string | null
          client_id: string | null
          total_items_value: number
          total_expenses_value: number
          net_value: number
          checked: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          invoice_type?: 'buy' | 'sell' | null
          invoice_date: string
          invoice_time?: string | null
          invoice_number: string
          warehouse_id?: string | null
          client_id?: string | null
          total_items_value?: number
          total_expenses_value?: number
          net_value?: number
          checked?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          invoice_type?: 'buy' | 'sell' | null
          invoice_date?: string
          invoice_time?: string | null
          invoice_number?: string
          warehouse_id?: string | null
          client_id?: string | null
          total_items_value?: number
          total_expenses_value?: number
          net_value?: number
          checked?: boolean
          notes?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string | null
          material_name_id: string | null
          unit_id: string | null
          egg_weight_id: string | null
          quantity: number
          weight: number | null
          price: number
          value: number
        }
        Insert: {
          id?: string
          invoice_id?: string | null
          material_name_id?: string | null
          unit_id?: string | null
          egg_weight_id?: string | null
          quantity?: number
          weight?: number | null
          price?: number
          value?: number
        }
        Update: {
          id?: string
          invoice_id?: string | null
          material_name_id?: string | null
          unit_id?: string | null
          egg_weight_id?: string | null
          quantity?: number
          weight?: number | null
          price?: number
          value?: number
        }
      }
      invoice_expenses: {
        Row: {
          id: string
          invoice_id: string | null
          expense_type_id: string | null
          amount: number
          account_name: string | null
        }
        Insert: {
          id?: string
          invoice_id?: string | null
          expense_type_id?: string | null
          amount?: number
          account_name?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string | null
          expense_type_id?: string | null
          amount?: number
          account_name?: string | null
        }
      }
      invoice_attachments: {
        Row: {
          id: string
          invoice_id: string | null
          file_url: string | null
          file_name: string | null
          file_type: string | null
        }
        Insert: {
          id?: string
          invoice_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: string | null
        }
      }
      manufacturing_invoices: {
        Row: {
          id: string
          invoice_number: string
          warehouse_id: string | null
          blend_name: string | null
          material_name_id: string | null
          unit_id: string | null
          quantity: number
          manufacturing_date: string
          manufacturing_time: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          invoice_number: string
          warehouse_id?: string | null
          blend_name?: string | null
          material_name_id?: string | null
          unit_id?: string | null
          quantity?: number
          manufacturing_date: string
          manufacturing_time?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          warehouse_id?: string | null
          blend_name?: string | null
          material_name_id?: string | null
          unit_id?: string | null
          quantity?: number
          manufacturing_date?: string
          manufacturing_time?: string | null
          notes?: string | null
        }
      }
      manufacturing_invoice_items: {
        Row: {
          id: string
          manufacturing_invoice_id: string | null
          material_name_id: string | null
          unit_id: string | null
          quantity: number
          blend_count: number
          weight: number | null
        }
        Insert: {
          id?: string
          manufacturing_invoice_id?: string | null
          material_name_id?: string | null
          unit_id?: string | null
          quantity?: number
          blend_count?: number
          weight?: number | null
        }
        Update: {
          id?: string
          manufacturing_invoice_id?: string | null
          material_name_id?: string | null
          unit_id?: string | null
          quantity?: number
          blend_count?: number
          weight?: number | null
        }
      }
      manufacturing_expenses: {
        Row: {
          id: string
          manufacturing_invoice_id: string | null
          expense_type_id: string | null
          amount: number | null
          account_name: string | null
        }
        Insert: {
          id?: string
          manufacturing_invoice_id?: string | null
          expense_type_id?: string | null
          amount?: number | null
          account_name?: string | null
        }
        Update: {
          id?: string
          manufacturing_invoice_id?: string | null
          expense_type_id?: string | null
          amount?: number | null
          account_name?: string | null
        }
      }
      manufacturing_attachments: {
        Row: {
          id: string
          manufacturing_invoice_id: string | null
          file_url: string | null
          file_name: string | null
          file_type: string | null
        }
        Insert: {
          id?: string
          manufacturing_invoice_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: string | null
        }
        Update: {
          id?: string
          manufacturing_invoice_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: string | null
        }
      }
      medicine_consumption_invoices: {
        Row: {
          id: string
          invoice_number: string
          invoice_date: string
          invoice_time: string | null
          warehouse_id: string | null
          poultry_status_id: string | null
          total_value: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          invoice_date: string
          invoice_time?: string | null
          warehouse_id?: string | null
          poultry_status_id?: string | null
          total_value?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          invoice_date?: string
          invoice_time?: string | null
          warehouse_id?: string | null
          poultry_status_id?: string | null
          total_value?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      medicine_consumption_items: {
        Row: {
          id: string
          consumption_invoice_id: string | null
          medicine_id: string | null
          unit_id: string | null
          administration_day: number | null
          administration_date: string | null
          quantity: number
          price: number
          value: number
        }
        Insert: {
          id?: string
          consumption_invoice_id?: string | null
          medicine_id?: string | null
          unit_id?: string | null
          administration_day?: number | null
          administration_date?: string | null
          quantity?: number
          price?: number
          value?: number
        }
        Update: {
          id?: string
          consumption_invoice_id?: string | null
          medicine_id?: string | null
          unit_id?: string | null
          administration_day?: number | null
          administration_date?: string | null
          quantity?: number
          price?: number
          value?: number
        }
      }
      medicine_consumption_expenses: {
        Row: {
          id: string
          consumption_invoice_id: string | null
          expense_type_id: string | null
          amount: number
          account_name: string | null
        }
        Insert: {
          id?: string
          consumption_invoice_id?: string | null
          expense_type_id?: string | null
          amount?: number
          account_name?: string | null
        }
        Update: {
          id?: string
          consumption_invoice_id?: string | null
          expense_type_id?: string | null
          amount?: number
          account_name?: string | null
        }
      }
      medicine_consumption_attachments: {
        Row: {
          id: string
          consumption_invoice_id: string | null
          file_url: string | null
          file_name: string | null
          file_type: string | null
        }
        Insert: {
          id?: string
          consumption_invoice_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: string | null
        }
        Update: {
          id?: string
          consumption_invoice_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_type?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role_enum: 'admin' | 'sub_admin' | 'farmer'
      client_type_enum: 'customer' | 'provider'
    }
  }
}

export type UserRole = Database['public']['Enums']['user_role_enum']
export type ClientType = Database['public']['Enums']['client_type_enum']
