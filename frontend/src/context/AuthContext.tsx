/**
 * Auth Context - Authentication state management for Invoicey application
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * Provides:
 * - User authentication state
 * - Sign up, sign in, sign out methods
 * - Session restoration on app load
 * - Auth state change listener
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Auth error messages mapping for user-friendly display
 */
const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email or password is incorrect',
  'User already registered': 'An account with this email already exists',
  'Password should be at least 6 characters': 'Password must be at least 6 characters',
  'Email not confirmed': 'Please check your email to confirm your account',
  'default': 'An error occurred. Please try again.'
};

/**
 * Get user-friendly error message from Supabase auth error
 */
function getAuthErrorMessage(error: AuthError): string {
  return AUTH_ERRORS[error.message] || AUTH_ERRORS['default'];
}

/**
 * Context value interface
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

/**
 * Create context with undefined default (will be provided by AuthProvider)
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component - Wraps the application with authentication state
 * 
 * Responsibilities:
 * - Check for existing session on mount (Requirement 2.4)
 * - Listen for auth state changes (Requirement 2.5)
 * - Provide sign up, sign in, sign out methods (Requirements 2.1, 2.2, 2.3)
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth state on mount
   * Requirement 2.4: Check for existing session and restore it
   */
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Failed to get initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes (Requirement 2.5)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Handle token refresh or session expiry
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign up a new user
   * Requirement 2.1: Create a new user account
   */
  const signUp = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: new Error(getAuthErrorMessage(error)) };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('An unexpected error occurred') 
      };
    }
  }, []);

  /**
   * Sign in an existing user
   * Requirement 2.2: Authenticate user and store session
   */
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: new Error(getAuthErrorMessage(error)) };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('An unexpected error occurred') 
      };
    }
  }, []);

  /**
   * Sign out the current user
   * Requirement 2.3: Clear session and redirect to login
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  }, []);

  /**
   * Memoized context value
   */
  const contextValue: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for consuming the Auth context
 * 
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Export context for testing purposes
export { AuthContext };
export type { AuthContextType };
