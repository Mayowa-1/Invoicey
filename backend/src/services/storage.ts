/**
 * Storage Service - localStorage wrapper with typed operations
 * Handles data persistence for clients, invoices, and invoice counter
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import type { Client, Invoice } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'invoicey_clients',
  INVOICES: 'invoicey_invoices',
  INVOICE_COUNTER: 'invoicey_invoice_counter',
} as const;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generic get operation with JSON deserialization
 * Returns null if key doesn't exist or localStorage is unavailable
 */
function get<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return null;
  }

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse stored data for key "${key}":`, error);
    return null;
  }
}

/**
 * Generic set operation with JSON serialization
 * Persists data immediately to localStorage
 */
function set<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`Failed to store data for key "${key}":`, error);
  }
}

/**
 * Remove a key from localStorage
 */
function remove(key: string): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove key "${key}":`, error);
  }
}

/**
 * Get all clients from storage
 * Returns empty array if no clients exist or storage is unavailable
 */
function getClients(): Client[] {
  const clients = get<Client[]>(STORAGE_KEYS.CLIENTS);
  return clients ?? [];
}

/**
 * Save clients to storage
 * Persists immediately per Requirement 1.2
 */
function setClients(clients: Client[]): void {
  set(STORAGE_KEYS.CLIENTS, clients);
}

/**
 * Get all invoices from storage
 * Returns empty array if no invoices exist or storage is unavailable
 */
function getInvoices(): Invoice[] {
  const invoices = get<Invoice[]>(STORAGE_KEYS.INVOICES);
  return invoices ?? [];
}

/**
 * Save invoices to storage
 * Persists immediately per Requirement 1.2
 */
function setInvoices(invoices: Invoice[]): void {
  set(STORAGE_KEYS.INVOICES, invoices);
}

/**
 * Get the current invoice counter
 * Returns 0 if no counter exists (for new installations)
 */
function getInvoiceCounter(): number {
  const counter = get<number>(STORAGE_KEYS.INVOICE_COUNTER);
  return counter ?? 0;
}

/**
 * Save the invoice counter
 */
function setInvoiceCounter(counter: number): void {
  set(STORAGE_KEYS.INVOICE_COUNTER, counter);
}

/**
 * Clear all application data from storage
 * Useful for testing or reset functionality
 */
function clearAll(): void {
  remove(STORAGE_KEYS.CLIENTS);
  remove(STORAGE_KEYS.INVOICES);
  remove(STORAGE_KEYS.INVOICE_COUNTER);
}

export const storage = {
  // Generic operations
  get,
  set,
  remove,
  
  // Typed operations for app data
  getClients,
  setClients,
  getInvoices,
  setInvoices,
  getInvoiceCounter,
  setInvoiceCounter,
  
  // Utility
  clearAll,
  isLocalStorageAvailable,
  
  // Export keys for testing
  STORAGE_KEYS,
};

export default storage;
