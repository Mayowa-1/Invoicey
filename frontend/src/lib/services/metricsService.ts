/**
 * Metrics Service - Dashboard metrics calculation
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * 
 * Calculates business metrics from user's Supabase data.
 */

import { supabase } from '../supabase';
import type { Metrics, InvoiceStatus } from '../database.types';

interface InvoiceRow {
  id: string;
  status: InvoiceStatus;
  total: number;
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
  console.error('Metrics service error:', error);

  if (isNetworkError(error)) {
    throw new Error('Unable to connect. Please check your internet connection.');
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
 * Metrics Service object
 */
export const metricsService = {
  /**
   * Get all dashboard metrics for the current user
   * Requirement 6.1: Calculate metrics from user's Supabase data
   * Requirement 6.2: Return total revenue, pending, and overdue amounts
   * Requirement 6.3: Return counts of invoices by status
   * Requirement 6.4: Return total client count
   */
  async getMetrics(): Promise<Metrics> {
    try {
      const userId = await getCurrentUserId();
      
      // Fetch all invoices for the user
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, status, total')
        .eq('user_id', userId);

      if (invoicesError) {
        handleError(invoicesError);
      }

      // Fetch client count
      const { count: clientCount, error: clientsError } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (clientsError) {
        handleError(clientsError);
      }

      // Calculate metrics from invoices
      const invoiceList = (invoices || []) as InvoiceRow[];
      
      // Requirement 6.2: Calculate amounts by status
      const totalRevenue = invoiceList
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

      const pendingAmount = invoiceList
        .filter(inv => inv.status === 'sent')
        .reduce((sum, inv) => sum + inv.total, 0);

      const overdueAmount = invoiceList
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.total, 0);

      // Requirement 6.3: Count invoices by status
      const paidInvoices = invoiceList.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = invoiceList.filter(inv => inv.status === 'sent').length;
      const overdueInvoices = invoiceList.filter(inv => inv.status === 'overdue').length;
      const draftInvoices = invoiceList.filter(inv => inv.status === 'draft').length;

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        totalClients: clientCount || 0,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        draftInvoices,
      };
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },
};

export default metricsService;
