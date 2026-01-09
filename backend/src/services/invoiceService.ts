/**
 * Invoice Service - CRUD operations for invoice management
 * 
 * Requirements: 3.2, 3.6, 3.7, 4.2, 4.3, 7.1, 7.2, 7.3, 8.1, 8.2, 10.1, 10.2, 11.2, 12.1, 16.2
 */

import type { Client, Invoice, LineItem, InvoiceInput, LineItemInput, ValidationResult, InvoiceStatus } from '../types';
import { storage } from './storage';
import { invoiceNumberGenerator } from './invoiceNumberGenerator';

/**
 * Generate a unique ID for a new invoice
 */
function generateId(): string {
  return `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique ID for a line item
 */
function generateLineItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current ISO date string (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate totals for line items
 * Requirements: 3.2, 11.2, 12.1
 * 
 * Property 8: Invoice Totals Calculation
 * - subtotal = sum of (quantity × rate) for all line items
 * - tax = subtotal × (taxRate / 100)
 * - total = subtotal + tax
 */
function calculateTotals(lineItems: LineItemInput[], taxRate: number = 10): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.rate);
  }, 0);

  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Get all invoices from storage
 */
function getAll(): Invoice[] {
  return storage.getInvoices();
}

/**
 * Get an invoice by ID
 */
function getById(id: string): Invoice | undefined {
  const invoices = storage.getInvoices();
  return invoices.find(invoice => invoice.id === id);
}


/**
 * Validate invoice input
 * Requirements: 3.6, 14.3, 14.4
 * 
 * Property 9: Invoice Validation Requires Client and Line Items
 */
function validate(input: InvoiceInput): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate client is selected
  if (!input.clientId || input.clientId.trim() === '') {
    errors.clientId = 'Please select a client';
  }

  // Validate line items exist
  if (!input.lineItems || input.lineItems.length === 0) {
    errors.lineItems = 'At least one line item is required';
  } else {
    // Check if all line items have empty descriptions
    const hasValidLineItem = input.lineItems.some(
      item => item.description && item.description.trim() !== ''
    );
    if (!hasValidLineItem) {
      errors.lineItems = 'At least one line item must have a description';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Convert LineItemInput to LineItem with calculated amount
 */
function createLineItem(input: LineItemInput): LineItem {
  return {
    id: generateLineItemId(),
    description: input.description,
    quantity: input.quantity,
    rate: input.rate,
    amount: Math.round(input.quantity * input.rate * 100) / 100,
  };
}

/**
 * Create a new invoice
 * Requirements: 3.2, 3.3, 3.4
 */
function create(input: InvoiceInput, clients: Client[]): Invoice {
  const validation = validate(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  // Find the client
  const client = clients.find(c => c.id === input.clientId);
  if (!client) {
    throw new Error(`Client with ID "${input.clientId}" not found`);
  }

  const invoices = storage.getInvoices();
  const lineItems = input.lineItems.map(createLineItem);
  const totals = calculateTotals(input.lineItems);

  const newInvoice: Invoice = {
    id: generateId(),
    invoiceNumber: invoiceNumberGenerator.generate(),
    clientId: input.clientId,
    client: client,
    status: input.status || 'draft',
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    lineItems: lineItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    notes: input.notes,
    createdAt: getCurrentDate(),
  };

  invoices.push(newInvoice);
  storage.setInvoices(invoices);

  return newInvoice;
}


/**
 * Update an existing invoice
 * Requirements: 3.5
 */
function update(id: string, input: InvoiceInput, clients: Client[]): Invoice {
  const validation = validate(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  const invoices = storage.getInvoices();
  const index = invoices.findIndex(invoice => invoice.id === id);

  if (index === -1) {
    throw new Error(`Invoice with ID "${id}" not found`);
  }

  // Find the client
  const client = clients.find(c => c.id === input.clientId);
  if (!client) {
    throw new Error(`Client with ID "${input.clientId}" not found`);
  }

  const existingInvoice = invoices[index];
  const lineItems = input.lineItems.map(createLineItem);
  const totals = calculateTotals(input.lineItems);

  const updatedInvoice: Invoice = {
    ...existingInvoice,
    clientId: input.clientId,
    client: client,
    status: input.status || existingInvoice.status,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    lineItems: lineItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    notes: input.notes,
    // Preserve original ID, invoiceNumber, and createdAt
    id: existingInvoice.id,
    invoiceNumber: existingInvoice.invoiceNumber,
    createdAt: existingInvoice.createdAt,
  };

  invoices[index] = updatedInvoice;
  storage.setInvoices(invoices);

  return updatedInvoice;
}

/**
 * Delete an invoice by ID
 * Requirements: 3.7
 * 
 * Property 10: Invoice Deletion Removes from Storage
 */
function deleteInvoice(id: string): void {
  const invoices = storage.getInvoices();
  const index = invoices.findIndex(invoice => invoice.id === id);

  if (index === -1) {
    throw new Error(`Invoice with ID "${id}" not found`);
  }

  invoices.splice(index, 1);
  storage.setInvoices(invoices);
}

/**
 * Search invoices by invoice number, client name, or company
 * Requirements: 8.1
 * 
 * Property 15: Invoice Search Filtering
 */
function search(query: string, invoices: Invoice[]): Invoice[] {
  if (!query || query.trim() === '') {
    return invoices;
  }

  const lowerQuery = query.toLowerCase().trim();

  return invoices.filter(invoice => {
    const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(lowerQuery);
    const clientNameMatch = invoice.client.name.toLowerCase().includes(lowerQuery);
    const companyMatch = invoice.client.company?.toLowerCase().includes(lowerQuery) ?? false;

    return invoiceNumberMatch || clientNameMatch || companyMatch;
  });
}

/**
 * Filter invoices by status
 * Requirements: 8.2
 * 
 * Property 16: Invoice Status Filtering
 */
function filterByStatus(status: string, invoices: Invoice[]): Invoice[] {
  if (!status || status === 'all') {
    return invoices;
  }

  return invoices.filter(invoice => invoice.status === status);
}


/**
 * Mark an invoice as paid
 * Requirements: 4.3, 16.2
 * 
 * Property 12: Mark as Paid Updates Status
 */
function markAsPaid(id: string): Invoice {
  const invoices = storage.getInvoices();
  const index = invoices.findIndex(invoice => invoice.id === id);

  if (index === -1) {
    throw new Error(`Invoice with ID "${id}" not found`);
  }

  const invoice = invoices[index];
  const updatedInvoice: Invoice = {
    ...invoice,
    status: 'paid',
  };

  invoices[index] = updatedInvoice;
  storage.setInvoices(invoices);

  return updatedInvoice;
}

/**
 * Mark an invoice as sent
 * Requirements: 3.4
 */
function markAsSent(id: string): Invoice {
  const invoices = storage.getInvoices();
  const index = invoices.findIndex(invoice => invoice.id === id);

  if (index === -1) {
    throw new Error(`Invoice with ID "${id}" not found`);
  }

  const invoice = invoices[index];
  const updatedInvoice: Invoice = {
    ...invoice,
    status: 'sent',
  };

  invoices[index] = updatedInvoice;
  storage.setInvoices(invoices);

  return updatedInvoice;
}

/**
 * Check and update overdue invoices
 * Requirements: 4.2, 10.1, 10.2
 * 
 * Property 11: Overdue Detection
 * - Invoices with status "sent" and dueDate before today become "overdue"
 * - Other statuses or future due dates remain unchanged
 */
function checkOverdue(invoices: Invoice[]): Invoice[] {
  const today = getCurrentDate();
  let hasChanges = false;

  const updatedInvoices = invoices.map(invoice => {
    // Only check "sent" invoices
    if (invoice.status === 'sent' && invoice.dueDate < today) {
      hasChanges = true;
      return {
        ...invoice,
        status: 'overdue' as InvoiceStatus,
      };
    }
    return invoice;
  });

  // Persist changes if any invoices were updated
  if (hasChanges) {
    storage.setInvoices(updatedInvoices);
  }

  return updatedInvoices;
}

/**
 * Duplicate an existing invoice
 * Requirements: 7.1, 7.2, 7.3
 * 
 * Property 14: Invoice Duplication
 * - New invoice number
 * - Same clientId and lineItems
 * - Status is "draft"
 * - issueDate is today
 * - Unique ID
 */
function duplicate(id: string, clients: Client[]): Invoice {
  const invoices = storage.getInvoices();
  const original = invoices.find(invoice => invoice.id === id);

  if (!original) {
    throw new Error(`Invoice with ID "${id}" not found`);
  }

  // Find the client (may have been updated since original invoice)
  const client = clients.find(c => c.id === original.clientId);
  if (!client) {
    throw new Error(`Client with ID "${original.clientId}" not found`);
  }

  const today = getCurrentDate();
  
  // Create new line items with new IDs
  const newLineItems: LineItem[] = original.lineItems.map(item => ({
    id: generateLineItemId(),
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
  }));

  const newInvoice: Invoice = {
    id: generateId(),
    invoiceNumber: invoiceNumberGenerator.generate(),
    clientId: original.clientId,
    client: client,
    status: 'draft',
    issueDate: today,
    dueDate: original.dueDate, // Keep original due date offset could be calculated, but keeping simple
    lineItems: newLineItems,
    subtotal: original.subtotal,
    tax: original.tax,
    total: original.total,
    notes: original.notes,
    createdAt: today,
  };

  invoices.push(newInvoice);
  storage.setInvoices(invoices);

  return newInvoice;
}

export const invoiceService = {
  // CRUD operations
  getAll,
  getById,
  create,
  update,
  delete: deleteInvoice,
  validate,
  
  // Calculations
  calculateTotals,
  
  // Status management
  markAsPaid,
  markAsSent,
  checkOverdue,
  
  // Duplication
  duplicate,
  
  // Search and filtering
  search,
  filterByStatus,
};

export default invoiceService;
