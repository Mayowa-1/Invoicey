// Database types for Supabase tables
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          company: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          company?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          company?: string | null
          phone?: string | null
          address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          issue_date: string
          due_date: string
          subtotal: number
          tax: number
          total: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          issue_date: string
          due_date: string
          subtotal?: number
          tax?: number
          total?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          invoice_number?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          issue_date?: string
          due_date?: string
          subtotal?: number
          tax?: number
          total?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invoices_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      line_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          rate: number
          amount: number
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          rate: number
          amount?: number
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          rate?: number
          amount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'line_items_invoice_id_fkey'
            columns: ['invoice_id']
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          }
        ]
      }
      invoice_sequences: {
        Row: {
          user_id: string
          last_number: number
        }
        Insert: {
          user_id: string
          last_number?: number
        }
        Update: {
          last_number?: number
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

// Application types (compatible with existing code)
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Client {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id: string
  clientId: string
  client?: Client
  invoiceNumber: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  lineItems: LineItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Metrics {
  totalRevenue: number
  pendingAmount: number
  overdueAmount: number
  totalClients: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  draftInvoices: number
}

// Input types for creating/updating records
export interface ClientInput {
  name: string
  email: string
  company?: string
  phone?: string
  address?: string
}

export interface LineItemInput {
  description: string
  quantity: number
  rate: number
}

export interface InvoiceInput {
  clientId: string
  issueDate: string
  dueDate: string
  lineItems: LineItemInput[]
  notes?: string
  status?: InvoiceStatus
}
