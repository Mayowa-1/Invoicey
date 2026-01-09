/**
 * Protected Route Component
 * 
 * Requirements: 3.1, 3.2
 * 
 * Provides:
 * - Redirect to login if user is not authenticated (Requirement 3.1)
 * - Render children if user is authenticated (Requirement 3.2)
 * - Show loading state while checking auth
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component - Guards routes that require authentication
 * 
 * Behavior:
 * - Shows loading spinner while checking auth state
 * - Redirects to /login if user is not authenticated
 * - Renders children if user is authenticated
 * - Preserves the intended destination for redirect after login
 */
export function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (Requirement 3.1)
  if (!user) {
    // Save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated (Requirement 3.2)
  return <>{children}</>;
}

export default ProtectedRoute;
