// =============================================================================
// Supabase Database Types
// Generated shape matching the migration schema.
// Keep this file in sync with migrations; regenerate with:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Invoice snapshot (stored as jsonb in invoices.snapshot_json)
// ---------------------------------------------------------------------------

export interface InvoiceSnapshotItem {
  id: string
  delivery_id: string
  site_name: string
  delivery_date: string // ISO date
  product_name: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  amount: number
}

export interface TaxGroup {
  tax_rate: number
  taxable_amount: number
  tax_amount: number
}

export interface InvoiceTotals {
  subtotal: number
  tax_total: number
  grand_total: number
}

export interface InvoiceSnapshot {
  invoice_number: string
  confirmed_at: string // ISO datetime
  closing_date: string // ISO date
  payment_due_date: string // ISO date
  /** 消費税は明細ごとに切り上げて計算しています */
  tax_note: string
  company: {
    id: string
    name: string
    invoice_number: string | null
    closing_day: number
    payment_type: 'after_30_days' | 'next_month_end'
  }
  bank_account: {
    bank_name: string
    branch_name: string
    account_type: '普通' | '当座' | '貯蓄'
    account_number: string
    account_holder: string
  } | null
  items: InvoiceSnapshotItem[]
  tax_groups: TaxGroup[]
  totals: InvoiceTotals
}

// ---------------------------------------------------------------------------
// Database schema
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      // ── profiles ───────────────────────────────────────────────────────────
      // Created outside migrations (auth.users mirror); lives in public schema.
      profiles: {
        Row: {
          id: string       // = auth.uid
          is_paid: boolean
          created_at: string
        }
        Insert: {
          id: string
          is_paid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          is_paid?: boolean
          created_at?: string
        }
        Relationships: []
      }

      // ── tenants ────────────────────────────────────────────────────────────
      tenants: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }

      // ── users ──────────────────────────────────────────────────────────────
      users: {
        Row: {
          id: string
          display_name: string
          created_at: string
        }
        Insert: {
          id: string // must match auth.users.id
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          created_at?: string
        }
        Relationships: []
      }

      // ── user_tenants ───────────────────────────────────────────────────────
      user_tenants: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_tenants_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_tenants_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }

      // ── companies ──────────────────────────────────────────────────────────
      companies: {
        Row: {
          id: string
          tenant_id: string
          name: string
          address: string | null        // migration 005
          phone: string | null          // migration 005
          closing_day: number           // 1-31 or 99 (= 月末)
          payment_type: 'after_30_days' | 'next_month_end'
          invoice_number: string | null
          active_flag: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          address?: string | null
          phone?: string | null
          closing_day: number
          payment_type: 'after_30_days' | 'next_month_end'
          invoice_number?: string | null
          active_flag?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          address?: string | null
          phone?: string | null
          closing_day?: number
          payment_type?: 'after_30_days' | 'next_month_end'
          invoice_number?: string | null
          active_flag?: boolean
          created_at?: string
        }
        Relationships: []
      }

      // ── own_company_profiles ────────────────────────────────────────────────
      own_company_profiles: {
        Row: {
          id: string
          tenant_id: string
          company_name: string | null
          address: string | null
          phone: string | null
          invoice_registration_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_name?: string | null
          address?: string | null
          phone?: string | null
          invoice_registration_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_name?: string | null
          address?: string | null
          phone?: string | null
          invoice_registration_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }

      // ── sites ──────────────────────────────────────────────────────────────
      sites: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          name: string
          active_flag: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          name: string
          active_flag?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          name?: string
          active_flag?: boolean
          created_at?: string
        }
        Relationships: []
      }

      // ── products ───────────────────────────────────────────────────────────
      products: {
        Row: {
          id: string
          tenant_id: string
          name: string
          spec: string | null
          unit_price: number | null     // null = provisional (no price set)
          tax_rate: 0.1 | 0.08
          status: 'active' | 'provisional'  // migration 005
          active_flag: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          spec?: string | null
          unit_price?: number | null
          tax_rate: 0.1 | 0.08
          status?: 'active' | 'provisional'
          active_flag?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          spec?: string | null
          unit_price?: number | null
          tax_rate?: 0.1 | 0.08
          status?: 'active' | 'provisional'
          active_flag?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ── bank_accounts ──────────────────────────────────────────────────────
      bank_accounts: {
        Row: {
          id: string
          tenant_id: string
          bank_name: string
          branch_name: string
          account_type: '普通' | '当座' | '貯蓄'
          account_number: string
          account_holder: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          bank_name: string
          branch_name: string
          account_type: '普通' | '当座' | '貯蓄'
          account_number: string
          account_holder: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          bank_name?: string
          branch_name?: string
          account_type?: '普通' | '当座' | '貯蓄'
          account_number?: string
          account_holder?: string
          is_default?: boolean
          created_at?: string
        }
        Relationships: []
      }

      // ── deliveries ─────────────────────────────────────────────────────────
      deliveries: {
        Row: {
          id: string
          tenant_id: string
          delivery_date: string // ISO date
          company_id: string
          site_id: string
          status: 'editable' | 'invoiced'
          created_by: string | null    // migration 005: user id who created
          role: 'field' | 'office' | 'admin' | null  // migration 005
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          delivery_date: string
          company_id: string
          site_id: string
          status?: 'editable' | 'invoiced'
          created_by?: string | null
          role?: 'field' | 'office' | 'admin' | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          delivery_date?: string
          company_id?: string
          site_id?: string
          status?: 'editable' | 'invoiced'
          created_by?: string | null
          role?: 'field' | 'office' | 'admin' | null
          created_at?: string
        }
        Relationships: []
      }

      // ── delivery_items ─────────────────────────────────────────────────────
      delivery_items: {
        Row: {
          id: string
          tenant_id: string
          delivery_id: string
          product_id: string
          quantity: number
          /** Set by DB trigger; null if product is provisional */
          snapshot_unit_price: number | null
          /** Set by DB trigger — do not read client-supplied value */
          snapshot_tax_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          delivery_id: string
          product_id: string
          quantity: number
          // The BEFORE INSERT trigger overwrites these from the product master.
          // Pass 0 as a placeholder to satisfy DB NOT NULL constraints.
          snapshot_unit_price?: number | null
          snapshot_tax_rate?: number
          created_at?: string
        }
        Update: {
          // Updating delivery_items on an invoiced delivery is blocked by trigger.
          id?: string
          tenant_id?: string
          delivery_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
        }
        Relationships: []
      }

      // ── invoice_number_sequences ───────────────────────────────────────────
      invoice_number_sequences: {
        Row: {
          tenant_id: string
          year: number
          last_seq: number
        }
        Insert: never // SECURITY DEFINER function only
        Update: never // SECURITY DEFINER function only
        Relationships: []
      }

      // ── invoices ───────────────────────────────────────────────────────────
      invoices: {
        Row: {
          id: string
          tenant_id: string
          invoice_number: string | null   // null until confirmed
          company_id: string
          closing_date: string            // ISO date
          payment_due_date: string        // ISO date
          period_from: string | null      // migration 005: billing period start
          period_to: string | null        // migration 005: billing period end
          total_amount: number | null     // migration 005: subtotal (tax-exclusive)
          tax_amount: number | null       // migration 005: tax total
          grand_total: number | null      // migration 005: total incl. tax
          status: 'draft' | 'confirmed' | 'cancelled'
          snapshot_json: InvoiceSnapshot | null  // null until confirmed
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          invoice_number?: string | null
          company_id: string
          closing_date: string
          payment_due_date: string
          period_from?: string | null
          period_to?: string | null
          total_amount?: number | null
          tax_amount?: number | null
          grand_total?: number | null
          status?: 'draft' | 'confirmed' | 'cancelled'
          snapshot_json?: InvoiceSnapshot | null
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          // Confirmed invoices: all updates blocked by DB trigger.
          id?: string
          tenant_id?: string
          invoice_number?: string | null
          company_id?: string
          closing_date?: string
          payment_due_date?: string
          period_from?: string | null
          period_to?: string | null
          total_amount?: number | null
          tax_amount?: number | null
          grand_total?: number | null
          status?: 'draft' | 'confirmed' | 'cancelled'
          snapshot_json?: InvoiceSnapshot | null
          confirmed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }

      // ── invoice_items ──────────────────────────────────────────────────────
      invoice_items: {
        Row: {
          id: string
          tenant_id: string
          invoice_id: string
          delivery_id: string
          site_name: string
          delivery_date: string // ISO date
          product_name: string
          quantity: number
          unit_price: number
          tax_rate: number
          /** CEIL(quantity * unit_price * tax_rate) */
          tax_amount: number
          /** quantity * unit_price */
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          invoice_id: string
          delivery_id: string
          site_name: string
          delivery_date: string
          product_name: string
          quantity: number
          unit_price: number
          tax_rate: number
          tax_amount: number
          amount: number
          created_at?: string
        }
        Update: {
          // Items of confirmed invoices: all changes blocked by DB trigger.
          id?: string
          tenant_id?: string
          invoice_id?: string
          delivery_id?: string
          site_name?: string
          delivery_date?: string
          product_name?: string
          quantity?: number
          unit_price?: number
          tax_rate?: number
          tax_amount?: number
          amount?: number
          created_at?: string
        }
        Relationships: []
      }
    }

    Views: Record<never, never>

    Functions: {
      confirm_invoice: {
        Args: { p_invoice_id: string }
        Returns: Json // InvoiceSnapshot
      }
      calculate_closing_date: {
        Args: { p_closing_day: number; p_base_date: string }
        Returns: string // ISO date
      }
      calculate_payment_due_date: {
        Args: { p_closing_date: string; p_payment_type: string }
        Returns: string // ISO date
      }
      generate_invoice_number: {
        Args: { p_tenant_id: string; p_year?: number }
        Returns: string
      }
      set_tenant_context: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      generate_invoices_for_date: {
        Args: { p_date?: string }
        Returns: {
          r_tenant_id: string
          r_company_id: string
          r_invoice_id: string | null
          r_result: 'created' | 'skipped' | 'no_items'
        }[]
      }
    }

    Enums: Record<never, never>
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers — same pattern as Supabase CLI codegen
// ---------------------------------------------------------------------------

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Named aliases for the most-used row types
export type Tenant              = Tables<'tenants'>
export type User                = Tables<'users'>
export type UserTenant          = Tables<'user_tenants'>
export type Company             = Tables<'companies'>
export type OwnCompanyProfile   = Tables<'own_company_profiles'>
export type Site                = Tables<'sites'>
export type Product             = Tables<'products'>
export type BankAccount         = Tables<'bank_accounts'>
export type Delivery            = Tables<'deliveries'>
export type DeliveryItem        = Tables<'delivery_items'>
export type Invoice             = Tables<'invoices'>
export type InvoiceItem         = Tables<'invoice_items'>
