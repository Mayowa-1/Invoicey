/**
 * Invoice Number Generator Service
 * Generates sequential invoice numbers in format INV-YYYY-NNN
 * Persists counter in localStorage and handles year rollover
 * 
 * Requirements: 3.1
 */

import { storage } from './storage';

const COUNTER_STORAGE_KEY = 'invoicey_invoice_counter_data';

interface CounterData {
  year: number;
  sequence: number;
}

/**
 * Get the current year
 */
function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get the stored counter data
 * Returns null if no counter exists
 */
function getCounterData(): CounterData | null {
  return storage.get<CounterData>(COUNTER_STORAGE_KEY);
}

/**
 * Save counter data to storage
 */
function setCounterData(data: CounterData): void {
  storage.set(COUNTER_STORAGE_KEY, data);
}

/**
 * Get the next sequence number, handling year rollover
 * If the stored year differs from current year, reset sequence to 1
 */
function getNextSequence(): number {
  const currentYear = getCurrentYear();
  const counterData = getCounterData();

  if (!counterData) {
    // First invoice ever - start at 1
    return 1;
  }

  if (counterData.year !== currentYear) {
    // Year rollover - reset sequence to 1
    return 1;
  }

  // Same year - increment sequence
  return counterData.sequence + 1;
}

/**
 * Generate a new invoice number in format INV-YYYY-NNN
 * Automatically increments and persists the counter
 */
function generate(): string {
  const currentYear = getCurrentYear();
  const sequence = getNextSequence();

  // Persist the new counter state
  setCounterData({
    year: currentYear,
    sequence: sequence,
  });

  // Format: INV-YYYY-NNN (zero-padded to 3 digits)
  const paddedSequence = String(sequence).padStart(3, '0');
  return `INV-${currentYear}-${paddedSequence}`;
}

/**
 * Reset the counter (useful for testing)
 */
function reset(): void {
  storage.remove(COUNTER_STORAGE_KEY);
}

export const invoiceNumberGenerator = {
  generate,
  getCurrentYear,
  getNextSequence,
  reset,
  // Expose for testing
  getCounterData,
  setCounterData,
  COUNTER_STORAGE_KEY,
};

export default invoiceNumberGenerator;
