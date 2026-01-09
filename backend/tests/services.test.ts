/**
 * Service Smoke Tests
 * Basic tests to verify all services are working correctly
 * 
 * This is a checkpoint test to ensure all service implementations are functional
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/services/storage';
import { clientService } from '../src/services/clientService';
import { invoiceService } from '../src/services/invoiceService';
import { invoiceNumberGenerator } from '../src/services/invoiceNumberGenerator';
import { metricsService } from '../src/services/metricsService';
import { recentItemsService } from '../src/services/recentItemsService';
import type { Client, Invoice } from '../src/types';

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Setup global localStorage mock
beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: localStorageMock },
    writable: true,
  });
});

describe('Storage Service', () => {
  it('should store and retrieve data', () => {
    storage.set('test_key', { foo: 'bar' });
    const result = storage.get<{ foo: string }>('test_key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should return null for non-existent keys', () => {
    const result = storage.get('non_existent');
    expect(result).toBeNull();
  });

  it('should store and retrieve clients', () => {
    const clients: Client[] = [
      { id: '1', name: 'Test Client', email: 'test@example.com', createdAt: '2026-01-01' }
    ];
    storage.setClients(clients);
    expect(storage.getClients()).toEqual(clients);
  });


  it('should store and retrieve invoices', () => {
    const invoices: Invoice[] = [];
    storage.setInvoices(invoices);
    expect(storage.getInvoices()).toEqual([]);
  });
});

describe('Client Service', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('should validate client input - requires name', () => {
    const result = clientService.validate({ name: '', email: 'test@example.com' });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should validate client input - requires email', () => {
    const result = clientService.validate({ name: 'Test', email: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('should validate valid client input', () => {
    const result = clientService.validate({ name: 'Test', email: 'test@example.com' });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('should create a client with unique ID', () => {
    const client = clientService.create({ name: 'Test Client', email: 'test@example.com' });
    expect(client.id).toBeDefined();
    expect(client.name).toBe('Test Client');
    expect(client.email).toBe('test@example.com');
    expect(client.createdAt).toBeDefined();
  });

  it('should get all clients', () => {
    clientService.create({ name: 'Client 1', email: 'client1@example.com' });
    clientService.create({ name: 'Client 2', email: 'client2@example.com' });
    const clients = clientService.getAll();
    expect(clients).toHaveLength(2);
  });

  it('should update a client', () => {
    const client = clientService.create({ name: 'Original', email: 'original@example.com' });
    const updated = clientService.update(client.id, { name: 'Updated', email: 'updated@example.com' });
    expect(updated.id).toBe(client.id);
    expect(updated.name).toBe('Updated');
    expect(updated.createdAt).toBe(client.createdAt);
  });

  it('should delete a client', () => {
    const client = clientService.create({ name: 'To Delete', email: 'delete@example.com' });
    expect(clientService.getAll()).toHaveLength(1);
    clientService.delete(client.id);
    expect(clientService.getAll()).toHaveLength(0);
  });

  it('should search clients', () => {
    const clients: Client[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com', company: 'Acme Inc', createdAt: '2026-01-01' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', company: 'Tech Corp', createdAt: '2026-01-02' },
    ];
    
    const results = clientService.search('john', clients);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('John Doe');
  });
});

describe('Invoice Number Generator', () => {
  beforeEach(() => {
    invoiceNumberGenerator.reset();
  });

  it('should generate invoice number in correct format', () => {
    const invoiceNumber = invoiceNumberGenerator.generate();
    const currentYear = new Date().getFullYear();
    expect(invoiceNumber).toMatch(new RegExp(`^INV-${currentYear}-\\d{3}$`));
  });

  it('should generate sequential numbers', () => {
    const first = invoiceNumberGenerator.generate();
    const second = invoiceNumberGenerator.generate();
    
    const firstNum = parseInt(first.split('-')[2]);
    const secondNum = parseInt(second.split('-')[2]);
    
    expect(secondNum).toBe(firstNum + 1);
  });
});


describe('Invoice Service', () => {
  const mockClient: Client = {
    id: 'client_1',
    name: 'Test Client',
    email: 'test@example.com',
    createdAt: '2026-01-01',
  };

  beforeEach(() => {
    storage.clearAll();
    invoiceNumberGenerator.reset();
    storage.setClients([mockClient]);
  });

  it('should calculate totals correctly', () => {
    const lineItems = [
      { description: 'Item 1', quantity: 2, rate: 100 },
      { description: 'Item 2', quantity: 1, rate: 50 },
    ];
    
    const totals = invoiceService.calculateTotals(lineItems, 10);
    
    expect(totals.subtotal).toBe(250);
    expect(totals.tax).toBe(25);
    expect(totals.total).toBe(275);
  });

  it('should validate invoice input - requires client', () => {
    const result = invoiceService.validate({
      clientId: '',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [{ description: 'Test', quantity: 1, rate: 100 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.clientId).toBeDefined();
  });

  it('should validate invoice input - requires line items', () => {
    const result = invoiceService.validate({
      clientId: 'client_1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.lineItems).toBeDefined();
  });

  it('should create an invoice', () => {
    const invoice = invoiceService.create({
      clientId: 'client_1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [{ description: 'Test Item', quantity: 2, rate: 100 }],
    }, [mockClient]);

    expect(invoice.id).toBeDefined();
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{3}$/);
    expect(invoice.clientId).toBe('client_1');
    expect(invoice.status).toBe('draft');
    expect(invoice.subtotal).toBe(200);
  });

  it('should mark invoice as paid', () => {
    const invoice = invoiceService.create({
      clientId: 'client_1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [{ description: 'Test', quantity: 1, rate: 100 }],
      status: 'sent',
    }, [mockClient]);

    const paid = invoiceService.markAsPaid(invoice.id);
    expect(paid.status).toBe('paid');
  });

  it('should detect overdue invoices', () => {
    const pastDate = '2020-01-01';
    invoiceService.create({
      clientId: 'client_1',
      issueDate: '2020-01-01',
      dueDate: pastDate,
      lineItems: [{ description: 'Test', quantity: 1, rate: 100 }],
      status: 'sent',
    }, [mockClient]);

    const invoices = invoiceService.getAll();
    const updated = invoiceService.checkOverdue(invoices);
    
    const overdueInvoice = updated.find(i => i.status === 'overdue');
    expect(overdueInvoice?.status).toBe('overdue');
  });

  it('should search invoices', () => {
    invoiceService.create({
      clientId: 'client_1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [{ description: 'Test', quantity: 1, rate: 100 }],
    }, [mockClient]);

    const invoices = invoiceService.getAll();
    const results = invoiceService.search('Test Client', invoices);
    expect(results).toHaveLength(1);
  });

  it('should filter invoices by status', () => {
    invoiceService.create({
      clientId: 'client_1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [{ description: 'Draft', quantity: 1, rate: 100 }],
      status: 'draft',
    }, [mockClient]);

    invoiceService.create({
      clientId: 'client_1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [{ description: 'Sent', quantity: 1, rate: 100 }],
      status: 'sent',
    }, [mockClient]);

    const invoices = invoiceService.getAll();
    const drafts = invoiceService.filterByStatus('draft', invoices);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].status).toBe('draft');
  });

  it('should duplicate an invoice', () => {
    const original = invoiceService.create({
      clientId: 'client_1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [{ description: 'Test', quantity: 1, rate: 100 }],
      status: 'sent',
    }, [mockClient]);

    const duplicate = invoiceService.duplicate(original.id, [mockClient]);
    
    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.invoiceNumber).not.toBe(original.invoiceNumber);
    expect(duplicate.clientId).toBe(original.clientId);
    expect(duplicate.status).toBe('draft');
    expect(duplicate.lineItems).toHaveLength(original.lineItems.length);
  });
});


describe('Metrics Service', () => {
  it('should calculate metrics correctly', () => {
    const clients: Client[] = [
      { id: '1', name: 'Client 1', email: 'c1@example.com', createdAt: '2026-01-01' },
      { id: '2', name: 'Client 2', email: 'c2@example.com', createdAt: '2026-01-02' },
    ];

    const invoices: Invoice[] = [
      {
        id: 'inv1', invoiceNumber: 'INV-2026-001', clientId: '1',
        client: clients[0], status: 'paid', issueDate: '2026-01-01',
        dueDate: '2026-01-31', lineItems: [], subtotal: 100, tax: 10, total: 110,
        createdAt: '2026-01-01',
      },
      {
        id: 'inv2', invoiceNumber: 'INV-2026-002', clientId: '1',
        client: clients[0], status: 'sent', issueDate: '2026-01-01',
        dueDate: '2026-01-31', lineItems: [], subtotal: 200, tax: 20, total: 220,
        createdAt: '2026-01-02',
      },
      {
        id: 'inv3', invoiceNumber: 'INV-2026-003', clientId: '2',
        client: clients[1], status: 'overdue', issueDate: '2026-01-01',
        dueDate: '2026-01-31', lineItems: [], subtotal: 300, tax: 30, total: 330,
        createdAt: '2026-01-03',
      },
      {
        id: 'inv4', invoiceNumber: 'INV-2026-004', clientId: '2',
        client: clients[1], status: 'draft', issueDate: '2026-01-01',
        dueDate: '2026-01-31', lineItems: [], subtotal: 400, tax: 40, total: 440,
        createdAt: '2026-01-04',
      },
    ];

    const metrics = metricsService.calculate(invoices, clients);

    expect(metrics.totalRevenue).toBe(110);
    expect(metrics.pendingAmount).toBe(220);
    expect(metrics.overdueAmount).toBe(330);
    expect(metrics.totalClients).toBe(2);
    expect(metrics.paidInvoices).toBe(1);
    expect(metrics.pendingInvoices).toBe(1);
    expect(metrics.overdueInvoices).toBe(1);
    expect(metrics.draftInvoices).toBe(1);
  });

  it('should return empty metrics for empty data', () => {
    const metrics = metricsService.calculate([], []);
    expect(metrics.totalRevenue).toBe(0);
    expect(metrics.totalClients).toBe(0);
  });
});

describe('Recent Items Service', () => {
  it('should return recent invoices sorted by createdAt descending', () => {
    const invoices: Invoice[] = [
      {
        id: 'inv1', invoiceNumber: 'INV-2026-001', clientId: '1',
        client: { id: '1', name: 'Client', email: 'c@example.com', createdAt: '2026-01-01' },
        status: 'draft', issueDate: '2026-01-01', dueDate: '2026-01-31',
        lineItems: [], subtotal: 100, tax: 10, total: 110, createdAt: '2026-01-01',
      },
      {
        id: 'inv2', invoiceNumber: 'INV-2026-002', clientId: '1',
        client: { id: '1', name: 'Client', email: 'c@example.com', createdAt: '2026-01-01' },
        status: 'draft', issueDate: '2026-01-02', dueDate: '2026-02-01',
        lineItems: [], subtotal: 200, tax: 20, total: 220, createdAt: '2026-01-03',
      },
      {
        id: 'inv3', invoiceNumber: 'INV-2026-003', clientId: '1',
        client: { id: '1', name: 'Client', email: 'c@example.com', createdAt: '2026-01-01' },
        status: 'draft', issueDate: '2026-01-02', dueDate: '2026-02-01',
        lineItems: [], subtotal: 300, tax: 30, total: 330, createdAt: '2026-01-02',
      },
    ];

    const recent = recentItemsService.getRecentInvoices(invoices, 5);
    
    expect(recent).toHaveLength(3);
    expect(recent[0].id).toBe('inv2');
    expect(recent[1].id).toBe('inv3');
    expect(recent[2].id).toBe('inv1');
  });

  it('should limit recent invoices to specified count', () => {
    const invoices: Invoice[] = Array.from({ length: 10 }, (_, i) => ({
      id: `inv${i}`, invoiceNumber: `INV-2026-00${i}`, clientId: '1',
      client: { id: '1', name: 'Client', email: 'c@example.com', createdAt: '2026-01-01' },
      status: 'draft' as const, issueDate: '2026-01-01', dueDate: '2026-01-31',
      lineItems: [], subtotal: 100, tax: 10, total: 110, createdAt: `2026-01-${String(i + 1).padStart(2, '0')}`,
    }));

    const recent = recentItemsService.getRecentInvoices(invoices, 5);
    expect(recent).toHaveLength(5);
  });

  it('should return recent clients sorted by createdAt descending', () => {
    const clients: Client[] = [
      { id: '1', name: 'Client A', email: 'a@example.com', createdAt: '2026-01-01' },
      { id: '2', name: 'Client B', email: 'b@example.com', createdAt: '2026-01-03' },
      { id: '3', name: 'Client C', email: 'c@example.com', createdAt: '2026-01-02' },
    ];

    const recent = recentItemsService.getRecentClients(clients, 4);
    
    expect(recent).toHaveLength(3);
    expect(recent[0].id).toBe('2');
    expect(recent[1].id).toBe('3');
    expect(recent[2].id).toBe('1');
  });

  it('should limit recent clients to specified count', () => {
    const clients: Client[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`, name: `Client ${i}`, email: `c${i}@example.com`,
      createdAt: `2026-01-${String(i + 1).padStart(2, '0')}`,
    }));

    const recent = recentItemsService.getRecentClients(clients, 4);
    expect(recent).toHaveLength(4);
  });
});
