'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { getKYCStatus } from '@/lib/kyc-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ProtectedRoute');

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  moderatorOnly?: boolean;
  requireKYC?: boolean;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  moderatorOnly = false,
  requireKYC = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [kycStatus, setKycStatus] = useState<'checking' | 'verified' | 'not_verified'>('checking');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate('/login', {
        state: { returnTo: location.pathname },
        replace: true,
      });
      return;
    }

    // Check role-based access
    if (adminOnly && !user?.roles.includes('admin')) {
      navigate('/unauthorized', { replace: true });
      return;
    }

    if (moderatorOnly && !user?.roles.some((role) => ['admin', 'moderator'].includes(role))) {
      navigate('/unauthorized', { replace: true });
      return;
    }

    // Check KYC status if required
    if (requireKYC && user?.id) {
      setKycStatus('checking');
      getKYCStatus(user.id)
        .then((status) => {
          if (status !== 'verified') {
            setKycStatus('not_verified');
            navigate('/kyc/required', { replace: true });
            return;
          }
          setKycStatus('verified');
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to check KYC status', err, { userId: user.id });
          setKycStatus('not_verified');
          navigate('/kyc/required', { replace: true });
        });
    } else if (requireKYC && !user?.id) {
      logger.warn('KYC required but user ID missing', {});
      navigate('/kyc/required', { replace: true });
    }
  }, [isAuthenticated, isLoading, user, adminOnly, moderatorOnly, requireKYC, navigate, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && !user?.roles.includes('admin')) {
    return null;
  }

  if (moderatorOnly && !user?.roles.some((role) => ['admin', 'moderator'].includes(role))) {
    return null;
  }

  // Check KYC status
  if (requireKYC) {
    if (kycStatus === 'checking') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }
    if (kycStatus === 'not_verified') {
      return null;
    }
  }

  return <>{children}</>;
}
