'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useAdmin from 'apps/admin-ui/src/app/hooks/useAdmin';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Full page loading component
const FullPageLoading = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

/**
 * AuthGuard component - Protects routes that require admin authentication
 * Shows loading state while checking auth, redirects to login if not authenticated
 */
export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { admin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when we're sure the admin is not authenticated
    if (!isLoading && !admin) {
      router.replace('/');
    }
  }, [admin, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <>{fallback || <FullPageLoading />}</>;
  }

  // Not authenticated - show loading while redirecting
  if (!admin) {
    return <>{fallback || <FullPageLoading />}</>;
  }

  // Authenticated - render children
  return <>{children}</>;
};

export default AuthGuard;
