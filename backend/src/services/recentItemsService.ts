/**
 * Recent Items Service - Functions for retrieving recent items
 * 
 * Requirements: 13.1, 13.2
 * 
 * Property 18: Recent Items Sorting
 * - Recent invoices: at most 5 invoices sorted by createdAt descending
 * - Recent clients: at most 4 clients sorted by createdAt descending
 */

import type { Client, Invoice } from '../types';

/**
 * Get the most recent invoices sorted by createdAt in descending order
 * Requirements: 13.1 - Display the 5 most recent invoices
 * 
 * @param invoices - Array of all invoices
 * @param limit - Maximum number of invoices to return (default: 5)
 * @returns Array of most recent invoices, sorted by createdAt descending
 */
function getRecentInvoices(invoices: Invoice[], limit: number = 5): Invoice[] {
  return [...invoices]
    .sort((a, b) => {
      // Sort by createdAt descending (most recent first)
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, limit);
}

/**
 * Get the most recent clients sorted by createdAt in descending order
 * Requirements: 13.2 - Display the 4 most recent clients
 * 
 * @param clients - Array of all clients
 * @param limit - Maximum number of clients to return (default: 4)
 * @returns Array of most recent clients, sorted by createdAt descending
 */
function getRecentClients(clients: Client[], limit: number = 4): Client[] {
  return [...clients]
    .sort((a, b) => {
      // Sort by createdAt descending (most recent first)
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, limit);
}

export const recentItemsService = {
  getRecentInvoices,
  getRecentClients,
};

export default recentItemsService;
