/**
 * Client Service - CRUD operations for client management
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5, 9.1
 */

import type { Client, ClientInput, ValidationResult } from '../types';
import { storage } from './storage';

/**
 * Generate a unique ID for a new client
 */
function generateId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current ISO date string
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get all clients from storage
 */
function getAll(): Client[] {
  return storage.getClients();
}

/**
 * Get a client by ID
 */
function getById(id: string): Client | undefined {
  const clients = storage.getClients();
  return clients.find(client => client.id === id);
}

/**
 * Validate client input
 * Requirements: 2.5, 14.1, 14.2
 */
function validate(input: ClientInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim() === '') {
    errors.name = 'Name is required';
  }

  if (!input.email || input.email.trim() === '') {
    errors.email = 'Email is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Create a new client
 * Requirements: 2.1 - Creates client with unique ID and timestamp
 */
function create(input: ClientInput): Client {
  const validation = validate(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  const clients = storage.getClients();
  
  const newClient: Client = {
    id: generateId(),
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company?.trim(),
    phone: input.phone?.trim(),
    address: input.address?.trim(),
    createdAt: getCurrentTimestamp(),
  };

  clients.push(newClient);
  storage.setClients(clients);

  return newClient;
}

/**
 * Update an existing client
 * Requirements: 2.2 - Updates client while preserving ID and createdAt
 */
function update(id: string, input: ClientInput): Client {
  const validation = validate(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  const clients = storage.getClients();
  const index = clients.findIndex(client => client.id === id);

  if (index === -1) {
    throw new Error(`Client with ID "${id}" not found`);
  }

  const existingClient = clients[index];
  const updatedClient: Client = {
    ...existingClient,
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company?.trim(),
    phone: input.phone?.trim(),
    address: input.address?.trim(),
    // Preserve original ID and createdAt
    id: existingClient.id,
    createdAt: existingClient.createdAt,
  };

  clients[index] = updatedClient;
  storage.setClients(clients);

  return updatedClient;
}

/**
 * Delete a client by ID
 * Requirements: 2.3 - Removes client from storage
 */
function deleteClient(id: string): void {
  const clients = storage.getClients();
  const index = clients.findIndex(client => client.id === id);

  if (index === -1) {
    throw new Error(`Client with ID "${id}" not found`);
  }

  clients.splice(index, 1);
  storage.setClients(clients);
}

/**
 * Check if a client has any invoices
 * Requirements: 2.4 - Used to warn before deletion
 */
function hasInvoices(clientId: string): boolean {
  const invoices = storage.getInvoices();
  return invoices.some(invoice => invoice.clientId === clientId);
}

/**
 * Search clients by name, email, or company
 * Requirements: 9.1 - Filter clients by search query
 */
function search(query: string, clients: Client[]): Client[] {
  if (!query || query.trim() === '') {
    return clients;
  }

  const lowerQuery = query.toLowerCase().trim();

  return clients.filter(client => {
    const nameMatch = client.name.toLowerCase().includes(lowerQuery);
    const emailMatch = client.email.toLowerCase().includes(lowerQuery);
    const companyMatch = client.company?.toLowerCase().includes(lowerQuery) ?? false;

    return nameMatch || emailMatch || companyMatch;
  });
}

export const clientService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteClient,
  validate,
  hasInvoices,
  search,
};

export default clientService;
