/**
 * Backend exports
 * 
 * Central export point for all backend services and types
 */

// Services
export { storage } from './services/storage';
export { clientService } from './services/clientService';
export { invoiceService } from './services/invoiceService';
export { invoiceNumberGenerator } from './services/invoiceNumberGenerator';
export { metricsService } from './services/metricsService';
export { recentItemsService } from './services/recentItemsService';
export { pdfService, generateInvoicePDF, downloadInvoicePDF } from './services/pdfService';

// Types
export * from './types';

// Data
export { clients, invoices } from './data/mockData';
