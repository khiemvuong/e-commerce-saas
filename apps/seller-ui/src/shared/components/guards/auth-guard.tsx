'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSeller from 'apps/seller-ui/src/hooks/useSeller';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Full page loading component
const FullPageLoading = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);

/**
 * AuthGuard component - Protects routes that require authentication
 * Shows loading state while checking auth, redirects to login if not authenticated
 */
export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { seller, isLoading } = useSeller();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when we're sure the user is not authenticated
    if (!isLoading && !seller) {
      router.replace('/login');
    }
  }, [seller, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <>{fallback || <FullPageLoading />}</>;
  }

  // Not authenticated - show loading while redirecting
  if (!seller) {
    return <>{fallback || <FullPageLoading />}</>;
  }

  // Authenticated - render children
  return <>{children}</>;
};

export default AuthGuard;
