/**
 * App Context - Global state management for Invoicey application
 * 
 * Requirements: 7.2 - Updated to use Supabase services
 * 
 * Provides:
 * - Global state for clients, invoices, and metrics
 * - CRUD actions for clients and invoices via Supabase
 * - Loading and error states for async operations
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Client, Invoice, Metrics, ClientInput, InvoiceInput } from '../lib/database.types';
import { clientService } from '../lib/services/clientService';
import { invoiceService } from '../lib/services/invoiceService';
import { metricsService } from '../lib/services/metricsService';
import { useAuth } from './AuthContext';

/**
 * Application state shape
 */
interface AppState {
  clients: Client[];
  invoices: Invoice[];
  metrics: Metrics;
  isLoading: boolean;
  error: string | null;
}

/**
 * Result type for operations that may fail
 */
interface OperationResult<T> {
  valid: boolean;
  errors: Record<string, string>;
  data?: T;
}

/**
 * Context value including state and actions
 */
interface AppContextValue extends AppState {
  // Client actions
  addClient: (input: ClientInput) => Promise<OperationResult<Client>>;
  updateClient: (id: string, input: ClientInput) => Promise<OperationResult<Client>>;
  deleteClient: (id: string) => Promise<boolean>;
  
  // Invoice actions
  addInvoice: (input: InvoiceInput) => Promise<OperationResult<Invoice>>;
  updateInvoice: (id: string, input: InvoiceInput) => Promise<OperationResult<Invoice>>;
  deleteInvoice: (id: string) => Promise<boolean>;
  duplicateInvoice: (id: string) => Promise<Invoice | null>;
  markInvoiceAsPaid: (id: string) => Promise<void>;
  markInvoiceAsSent: (id: string) => Promise<void>;
  
  // Utility
  getClientById: (id: string) => Client | undefined;
  getInvoiceById: (id: string) => Invoice | undefined;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

/**
 * Default metrics when no data is loaded
 */
const defaultMetrics: Metrics = {
  totalRevenue: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  totalClients: 0,
  paidInvoices: 0,
  pendingInvoices: 0,
  overdueInvoices: 0,
  draftInvoices: 0,
};

/**
 * Create context with undefined default (will be provided by AppProvider)
 */
const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Props for AppProvider component
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider component - Wraps the application with global state
 * 
 * Responsibilities:
 * - Load data from Supabase on mount when authenticated
 * - Provide CRUD actions for clients and invoices
 * - Handle loading and error states
 */
export function AppProvider({ children }: AppProviderProps): React.ReactElement {
  const { user } = useAuth();
  
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load all data from Supabase
   */
  const loadData = useCallback(async () => {
    if (!user) {
      setClients([]);
      setInvoices([]);
      setMetrics(defaultMetrics);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load all data in parallel
      const [clientsData, invoicesData, metricsData] = await Promise.all([
        clientService.getAll(),
        invoiceService.getAll(),
        metricsService.getMetrics(),
      ]);

      setClients(clientsData);
      setInvoices(invoicesData);
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      // Initialize with empty data on error
      setClients([]);
      setInvoices([]);
      setMetrics(defaultMetrics);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Refresh data from Supabase
   */
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  /**
   * Load data when user changes (login/logout)
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // Client Actions
  // ============================================

  /**
   * Add a new client
   * Requirement 4.1: Insert client with user's ID
   */
  const addClient = useCallback(async (input: ClientInput): Promise<OperationResult<Client>> => {
    try {
      const newClient = await clientService.create(input);
      
      // Update local state
      setClients(prev => [newClient, ...prev]);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalClients: prev.totalClients + 1,
      }));
      
      return { valid: true, errors: {}, data: newClient };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create client';
      return { valid: false, errors: { general: message } };
    }
  }, []);

  /**
   * Update an existing client
   * Requirement 4.3: Update client record in Supabase
   */
  const updateClient = useCallback(async (id: string, input: ClientInput): Promise<OperationResult<Client>> => {
    try {
      const updatedClient = await clientService.update(id, input);
      
      // Update local state
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      
      // Also update client reference in invoices
      setInvoices(prev => prev.map(inv => {
        if (inv.clientId === id) {
          return { ...inv, client: updatedClient };
        }
        return inv;
      }));
      
      return { valid: true, errors: {}, data: updatedClient };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update client';
      return { valid: false, errors: { general: message } };
    }
  }, []);

  /**
   * Delete a client
   * Requirement 4.4: Remove client from Supabase
   */
  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    try {
      await clientService.delete(id);
      
      // Update local state
      setClients(prev => prev.filter(c => c.id !== id));
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalClients: Math.max(0, prev.totalClients - 1),
      }));
      
      return true;
    } catch (err) {
      console.error('Failed to delete client:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      return false;
    }
  }, []);

  // ============================================
  // Invoice Actions
  // ============================================

  /**
   * Add a new invoice
   * Requirement 5.1: Insert invoice and line items into Supabase
   */
  const addInvoice = useCallback(async (input: InvoiceInput): Promise<OperationResult<Invoice>> => {
    // Basic validation
    if (!input.clientId) {
      return { valid: false, errors: { clientId: 'Client is required' } };
    }
    if (!input.dueDate) {
      return { valid: false, errors: { dueDate: 'Due date is required' } };
    }
    if (!input.lineItems || input.lineItems.length === 0) {
      return { valid: false, errors: { lineItems: 'At least one line item is required' } };
    }

    try {
      const newInvoice = await invoiceService.create(input);
      
      // Update local state
      setInvoices(prev => [newInvoice, ...prev]);
      
      // Refresh metrics to get accurate counts
      const updatedMetrics = await metricsService.getMetrics();
      setMetrics(updatedMetrics);
      
      return { valid: true, errors: {}, data: newInvoice };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invoice';
      return { valid: false, errors: { general: message } };
    }
  }, []);

  /**
   * Update an existing invoice
   * Requirement 5.3: Update invoice and line items in Supabase
   */
  const updateInvoice = useCallback(async (id: string, input: InvoiceInput): Promise<OperationResult<Invoice>> => {
    // Basic validation
    if (!input.clientId) {
      return { valid: false, errors: { clientId: 'Client is required' } };
    }
    if (!input.dueDate) {
      return { valid: false, errors: { dueDate: 'Due date is required' } };
    }
    if (!input.lineItems || input.lineItems.length === 0) {
      return { valid: false, errors: { lineItems: 'At least one line item is required' } };
    }

    try {
      const updatedInvoice = await invoiceService.update(id, input);
      
      // Update local state
      setInvoices(prev => prev.map(inv => inv.id === id ? updatedInvoice : inv));
      
      // Refresh metrics if status changed
      const updatedMetrics = await metricsService.getMetrics();
      setMetrics(updatedMetrics);
      
      return { valid: true, errors: {}, data: updatedInvoice };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update invoice';
      return { valid: false, errors: { general: message } };
    }
  }, []);

  /**
   * Delete an invoice
   * Requirement 5.4: Remove invoice and associated line items
   */
  const deleteInvoice = useCallback(async (id: string): Promise<boolean> => {
    try {
      await invoiceService.delete(id);
      
      // Update local state
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      
      // Refresh metrics
      const updatedMetrics = await metricsService.getMetrics();
      setMetrics(updatedMetrics);
      
      return true;
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete invoice');
      return false;
    }
  }, []);

  /**
   * Duplicate an invoice
   */
  const duplicateInvoice = useCallback(async (id: string): Promise<Invoice | null> => {
    try {
      const newInvoice = await invoiceService.duplicate(id);
      
      // Update local state
      setInvoices(prev => [newInvoice, ...prev]);
      
      // Refresh metrics
      const updatedMetrics = await metricsService.getMetrics();
      setMetrics(updatedMetrics);
      
      return newInvoice;
    } catch (err) {
      console.error('Failed to duplicate invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate invoice');
      return null;
    }
  }, []);

  /**
   * Mark an invoice as paid
   */
  const markInvoiceAsPaid = useCallback(async (id: string): Promise<void> => {
    try {
      const updatedInvoice = await invoiceService.markAsPaid(id);
      
      // Update local state
      setInvoices(prev => prev.map(inv => inv.id === id ? updatedInvoice : inv));
      
      // Refresh metrics
      const updatedMetrics = await metricsService.getMetrics();
      setMetrics(updatedMetrics);
    } catch (err) {
      console.error('Failed to mark invoice as paid:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark invoice as paid');
    }
  }, []);

  /**
   * Mark an invoice as sent
   */
  const markInvoiceAsSent = useCallback(async (id: string): Promise<void> => {
    try {
      const updatedInvoice = await invoiceService.update(id, { status: 'sent' });
      
      // Update local state
      setInvoices(prev => prev.map(inv => inv.id === id ? updatedInvoice : inv));
      
      // Refresh metrics
      const updatedMetrics = await metricsService.getMetrics();
      setMetrics(updatedMetrics);
    } catch (err) {
      console.error('Failed to mark invoice as sent:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark invoice as sent');
    }
  }, []);

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Get a client by ID
   */
  const getClientById = useCallback((id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  }, [clients]);

  /**
   * Get an invoice by ID
   */
  const getInvoiceById = useCallback((id: string): Invoice | undefined => {
    return invoices.find(inv => inv.id === id);
  }, [invoices]);

  // ============================================
  // Context Value
  // ============================================

  const contextValue: AppContextValue = useMemo(() => ({
    // State
    clients,
    invoices,
    metrics,
    isLoading,
    error,
    
    // Client actions
    addClient,
    updateClient,
    deleteClient,
    
    // Invoice actions
    addInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    markInvoiceAsPaid,
    markInvoiceAsSent,
    
    // Utility
    getClientById,
    getInvoiceById,
    refreshData,
    clearError,
  }), [
    clients,
    invoices,
    metrics,
    isLoading,
    error,
    addClient,
    updateClient,
    deleteClient,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    markInvoiceAsPaid,
    markInvoiceAsSent,
    getClientById,
    getInvoiceById,
    refreshData,
    clearError,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook for consuming the App context
 * 
 * @throws Error if used outside of AppProvider
 */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
}

// Export context for testing purposes
export { AppContext };
export type { AppContextValue, AppState, OperationResult };
