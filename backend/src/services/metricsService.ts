/**
 * Metrics Service - Calculate dashboard metrics from invoice and client data
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * 
 * Property 13: Metrics Calculation
 * - totalRevenue = sum of total for all invoices with status "paid"
 * - pendingAmount = sum of total for all invoices with status "sent"
 * - overdueAmount = sum of total for all invoices with status "overdue"
 * - totalClients = count of clients
 * - paidInvoices, pendingInvoices, overdueInvoices, draftInvoices = counts by status
 */

import type { Invoice, Client, Metrics } from '../types';

/**
 * Calculate all dashboard metrics from invoices and clients
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
function calculate(invoices: Invoice[], clients: Client[]): Metrics {
  // Initialize counters
  let totalRevenue = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;
  let paidInvoices = 0;
  let pendingInvoices = 0;
  let overdueInvoices = 0;
  let draftInvoices = 0;

  // Process each invoice
  for (const invoice of invoices) {
    switch (invoice.status) {
      case 'paid':
        // Requirement 5.1: totalRevenue from paid invoices
        totalRevenue += invoice.total;
        paidInvoices++;
        break;
      case 'sent':
        // Requirement 5.2: pendingAmount from sent invoices
        pendingAmount += invoice.total;
        pendingInvoices++;
        break;
      case 'overdue':
        // Requirement 5.3: overdueAmount from overdue invoices
        overdueAmount += invoice.total;
        overdueInvoices++;
        break;
      case 'draft':
        draftInvoices++;
        break;
    }
  }

  return {
    // Requirement 5.1: Total revenue from paid invoices
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    // Requirement 5.2: Pending amount from sent invoices
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    // Requirement 5.3: Overdue amount from overdue invoices
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    // Requirement 5.4: Count of clients
    totalClients: clients.length,
    // Requirement 5.4: Invoice counts by status
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    draftInvoices,
  };
}

/**
 * Get empty metrics (useful for initial state)
 */
function getEmptyMetrics(): Metrics {
  return {
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    totalClients: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    draftInvoices: 0,
  };
}

export const metricsService = {
  calculate,
  getEmptyMetrics,
};

export default metricsService;
