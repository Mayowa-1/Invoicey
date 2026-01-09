/**
 * Client Service - Supabase client data management
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 * 
 * Provides CRUD operations for clients with user isolation via RLS.
 * All operations include user_id for data isolation.
 */

import { supabase } from '../supabase';
import type { Client, ClientInput } from '../database.types';

interface ClientRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database row to application Client type
 */
function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message === 'Failed to fetch';
}

/**
 * Handle Supabase errors and return user-friendly messages
 * Requirement 4.6: Handle database errors gracefully
 */
function handleError(error: unknown): never {
  console.error('Client service error:', error);

  if (isNetworkError(error)) {
    throw new Error('Unable to connect. Please check your internet connection.');
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string; message: string };
    
    if (pgError.code === '23505') {
      throw new Error('A client with this information already exists');
    }
    if (pgError.code === '23503') {
      throw new Error('Referenced record does not exist');
    }
    if (pgError.code === 'PGRST116') {
      throw new Error('Client not found');
    }
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
 * Client Service object with all CRUD operations
 */
export const clientService = {
  /**
   * Get all clients for the current user
   * Requirement 4.2: Fetch only clients belonging to the user
   */
  async getAll(): Promise<Client[]> {
    try {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error);
      }

      return (data || []).map(toClient);
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Get a single client by ID
   */
  async getById(id: string): Promise<Client | null> {
    try {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        handleError(error);
      }

      return data ? toClient(data) : null;
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Create a new client
   * Requirement 4.1: Insert client with user's ID
   */
  async create(input: ClientInput): Promise<Client> {
    try {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: input.name,
          email: input.email,
          company: input.company ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
        })
        .select()
        .single();

      if (error) {
        handleError(error);
      }

      if (!data) {
        throw new Error('Failed to create client');
      }

      return toClient(data);
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Update an existing client
   * Requirement 4.3: Update client record in Supabase
   */
  async update(id: string, input: Partial<ClientInput>): Promise<Client> {
    try {
      const userId = await getCurrentUserId();
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.company !== undefined) updateData.company = input.company ?? null;
      if (input.phone !== undefined) updateData.phone = input.phone ?? null;
      if (input.address !== undefined) updateData.address = input.address ?? null;

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        handleError(error);
      }

      if (!data) {
        throw new Error('Client not found');
      }

      return toClient(data);
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Delete a client
   * Requirement 4.4: Remove client from Supabase
   */
  async delete(id: string): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        handleError(error);
      }
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },

  /**
   * Search clients by name, email, or company
   * Requirement 4.5: Filter results from Supabase
   */
  async search(query: string): Promise<Client[]> {
    try {
      const userId = await getCurrentUserId();
      const searchTerm = `%${query}%`;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`)
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error);
      }

      return (data || []).map(toClient);
    } catch (error) {
      if (error instanceof Error) throw error;
      handleError(error);
    }
  },
};

export default clientService;
