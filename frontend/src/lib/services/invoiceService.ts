/**
 * Invoice Service - Supabase invoice data management
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 * 
 * Provides CRUD operations for invoices with user isolation via RLS.
 * Handles line items, total calculations, and invoice number generation.
 */

import { supabase } from '../supabase';
import type { Invoice, InvoiceInput, InvoiceStatus, LineItem, LineItemInput, Client } from '../database.types';

interface InvoiceRow {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface LineItemRow {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface ClientRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database row to application LineItem type
 */
function toLineItem(row: LineItemRow): LineItem {
  return {
    id: row.id,
    description: row.description,
    quantity: row.quantity,
    rate: row.rate,
    amount: row.amount,
  };
}


/**
 * Transform database row to application Client type
 */
function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform database row to application Invoice type
 */
function toInvoice(row: InvoiceRow, lineItems: LineItemRow[] = [], client?: ClientRow): Invoice {
  return {
    id: row.id,
    clientId: row.client_id || '',
    client: client ? toClient(client) : undefined,
    invoiceNumber: row.invoice_number,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    lineItems: lineItems.map(toLineItem),
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message === 'Failed to fetch';
}

/**
 * Handle Supabase errors and return user-friendly messages
 */
function handleError(error: unknown): never {
  console.error('Invoice service error:', error);

  if (isNetworkError(error)) {
    throw new Error('Unable to connect. Please check your internet connection.');
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string; message: string };
    
    if (pgError.code === '23505') {
      throw new Error('An invoice with this number already exists');
    }
    if (pgError.code === '23503') {
      throw new Error('Referenced client does not exist');
    }
    if (pgError.code === 'PGRST116') {
      throw new Error('Invoice not found');
    }
  }

  throw new Error('A database error occurred. Please try again.');
}

/**
 * Get current authenticated user ID
 */
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('You must be logged in to perform this action');
  }
  
  return user.id;
}

/**
 * Calculate invoice totals from line items
 * Requirement 5.6: Calculate totals before saving
 */
function calculateTotals(lineItems: LineItemInput[], taxRate: number = 0): { subtotal: number; tax: number; total: number } {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}


/**
 * Invoice Service object with all CRUD operations
 */
export const invoiceService = {
  /**
   * Get all invoices for the current user
   * Requirement 5.2: Fetch only invoices belonging to the user
   * Requirement 5.7: Include associated client and line items
   */
  async getAll(): Promise<Invoice[]> {
    try {
      const userId = await getCurrentUserId();
      
      // Fetch invoices with client data
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        handleError(invoicesError);
      }

      if (!invoices || invoices.length === 0) {
        return [];
      }

      // Fetch all line items for these invoices
      const invoiceIds = invoices.map(inv => inv.id);
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('line_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (lineItemsError) {
        handleError(lineItemsError);
      }

      // Group line items by invoice_id
      const lineItemsByInvoice = (lineItems || []).reduce((acc, item) => {
        if (!acc[item.invoice_id]) {
          acc[item.invoice_id] = [];
        }
        acc[item.invoice_id].push(item);
        return acc;
      }, {} as Record<string, LineItemRow[]>);

      return invoices.map(inv => 
        toInvoice(
          inv as InvoiceRow, 
          lineItemsByInvoice[inv.id] || [],
          inv.clients as ClientRow | undefined
        )
      );
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Get a single invoice by ID
   * Requirement 5.7: Include associated client and line items
   */
  async getById(id: string): Promise<Invoice | null> {
    try {
      const userId = await getCurrentUserId();
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (invoiceError) {
        if (invoiceError.code === 'PGRST116') {
          return null;
        }
        handleError(invoiceError);
      }

      if (!invoice) {
        return null;
      }

      // Fetch line items for this invoice
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', id);

      if (lineItemsError) {
        handleError(lineItemsError);
      }

      return toInvoice(
        invoice as InvoiceRow,
        (lineItems || []) as LineItemRow[],
        invoice.clients as ClientRow | undefined
      );
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },


  /**
   * Create a new invoice with line items
   * Requirement 5.1: Insert invoice and line items into Supabase
   * Requirement 5.6: Calculate totals before saving
   */
  async create(input: InvoiceInput): Promise<Invoice> {
    try {
      const userId = await getCurrentUserId();
      const invoiceNumber = await this.generateInvoiceNumber();
      const totals = calculateTotals(input.lineItems);
      
      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: userId,
          client_id: input.clientId || null,
          invoice_number: invoiceNumber,
          status: input.status || 'draft',
          issue_date: input.issueDate,
          due_date: input.dueDate,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          notes: input.notes ?? null,
        })
        .select('*, clients(*)')
        .single();

      if (invoiceError) {
        handleError(invoiceError);
      }

      if (!invoice) {
        throw new Error('Failed to create invoice');
      }

      // Insert line items
      if (input.lineItems.length > 0) {
        const lineItemsToInsert = input.lineItems.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
        }));

        const { error: lineItemsError } = await supabase
          .from('line_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) {
          // Rollback: delete the invoice if line items fail
          await supabase.from('invoices').delete().eq('id', invoice.id);
          handleError(lineItemsError);
        }
      }

      // Fetch the complete invoice with line items
      return await this.getById(invoice.id) as Invoice;
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Update an existing invoice
   * Requirement 5.3: Update invoice and line items in Supabase
   * Requirement 5.6: Calculate totals before saving
   */
  async update(id: string, input: Partial<InvoiceInput>): Promise<Invoice> {
    try {
      const userId = await getCurrentUserId();
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.clientId !== undefined) updateData.client_id = input.clientId || null;
      if (input.issueDate !== undefined) updateData.issue_date = input.issueDate;
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
      if (input.notes !== undefined) updateData.notes = input.notes ?? null;
      if (input.status !== undefined) updateData.status = input.status;

      // Recalculate totals if line items are provided
      if (input.lineItems !== undefined) {
        const totals = calculateTotals(input.lineItems);
        updateData.subtotal = totals.subtotal;
        updateData.tax = totals.tax;
        updateData.total = totals.total;
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, clients(*)')
        .single();

      if (invoiceError) {
        handleError(invoiceError);
      }

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Update line items if provided
      if (input.lineItems !== undefined) {
        // Delete existing line items
        await supabase.from('line_items').delete().eq('invoice_id', id);

        // Insert new line items
        if (input.lineItems.length > 0) {
          const lineItemsToInsert = input.lineItems.map(item => ({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          }));

          const { error: lineItemsError } = await supabase
            .from('line_items')
            .insert(lineItemsToInsert);

          if (lineItemsError) {
            handleError(lineItemsError);
          }
        }
      }

      // Fetch the complete invoice with line items
      return await this.getById(id) as Invoice;
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },


  /**
   * Delete an invoice and its line items
   * Requirement 5.4: Remove invoice and associated line items
   */
  async delete(id: string): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      
      // Line items will be deleted automatically via CASCADE
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        handleError(error);
      }
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Search invoices by invoice number or client name
   */
  async search(query: string): Promise<Invoice[]> {
    try {
      const userId = await getCurrentUserId();
      const searchTerm = `%${query}%`;
      
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('user_id', userId)
        .or(`invoice_number.ilike.${searchTerm}`)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        handleError(invoicesError);
      }

      if (!invoices || invoices.length === 0) {
        return [];
      }

      // Fetch line items
      const invoiceIds = invoices.map(inv => inv.id);
      const { data: lineItems } = await supabase
        .from('line_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      const lineItemsByInvoice = (lineItems || []).reduce((acc, item) => {
        if (!acc[item.invoice_id]) {
          acc[item.invoice_id] = [];
        }
        acc[item.invoice_id].push(item);
        return acc;
      }, {} as Record<string, LineItemRow[]>);

      return invoices.map(inv => 
        toInvoice(
          inv as InvoiceRow, 
          lineItemsByInvoice[inv.id] || [],
          inv.clients as ClientRow | undefined
        )
      );
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Filter invoices by status
   */
  async filterByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    try {
      const userId = await getCurrentUserId();
      
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        handleError(invoicesError);
      }

      if (!invoices || invoices.length === 0) {
        return [];
      }

      // Fetch line items
      const invoiceIds = invoices.map(inv => inv.id);
      const { data: lineItems } = await supabase
        .from('line_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      const lineItemsByInvoice = (lineItems || []).reduce((acc, item) => {
        if (!acc[item.invoice_id]) {
          acc[item.invoice_id] = [];
        }
        acc[item.invoice_id].push(item);
        return acc;
      }, {} as Record<string, LineItemRow[]>);

      return invoices.map(inv => 
        toInvoice(
          inv as InvoiceRow, 
          lineItemsByInvoice[inv.id] || [],
          inv.clients as ClientRow | undefined
        )
      );
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },


  /**
   * Mark an invoice as paid
   */
  async markAsPaid(id: string): Promise<Invoice> {
    try {
      const userId = await getCurrentUserId();
      
      const { data: invoice, error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid' as InvoiceStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, clients(*)')
        .single();

      if (error) {
        handleError(error);
      }

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Fetch line items
      const { data: lineItems } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', id);

      return toInvoice(
        invoice as InvoiceRow,
        (lineItems || []) as LineItemRow[],
        invoice.clients as ClientRow | undefined
      );
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Duplicate an existing invoice
   */
  async duplicate(id: string): Promise<Invoice> {
    try {
      // Verify user is authenticated (getById will also check)
      await getCurrentUserId();
      
      // Fetch the original invoice
      const original = await this.getById(id);
      if (!original) {
        throw new Error('Invoice not found');
      }

      // Create a new invoice with the same data
      const newInvoice = await this.create({
        clientId: original.clientId,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lineItems: original.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
        })),
        notes: original.notes,
        status: 'draft',
      });

      return newInvoice;
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Generate a unique invoice number for the current user
   * Requirement 5.5: Use per-user sequence stored in Supabase
   */
  async generateInvoiceNumber(): Promise<string> {
    try {
      const userId = await getCurrentUserId();
      
      // Try to get existing sequence
      const { data: sequence, error: fetchError } = await supabase
        .from('invoice_sequences')
        .select('last_number')
        .eq('user_id', userId)
        .single();

      let nextNumber: number;

      if (fetchError && fetchError.code === 'PGRST116') {
        // No sequence exists, create one
        const { error: insertError } = await supabase
          .from('invoice_sequences')
          .insert({ user_id: userId, last_number: 1 });

        if (insertError) {
          handleError(insertError);
        }
        nextNumber = 1;
      } else if (fetchError) {
        handleError(fetchError);
      } else {
        // Increment the sequence
        nextNumber = (sequence?.last_number || 0) + 1;
        
        const { error: updateError } = await supabase
          .from('invoice_sequences')
          .update({ last_number: nextNumber })
          .eq('user_id', userId);

        if (updateError) {
          handleError(updateError);
        }
      }

      // Format as INV-XXXX
      return `INV-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },
};

export default invoiceService;
