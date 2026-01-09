// Re-export types from mockData for cleaner imports
export type { Client, LineItem, Invoice } from '../data/mockData';

// Additional types for the application

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Metrics {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalClients: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  draftInvoices: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface ClientInput {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
}

export interface LineItemInput {
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceInput {
  clientId: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItemInput[];
  notes?: string;
  status?: InvoiceStatus;
}
