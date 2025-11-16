/**
 * useKYCStatus Hook
 *
 * Hook to fetch and manage KYC verification status
 */

import { useState, useEffect, useCallback } from 'react';
import { kycApi } from '@/api/kyc-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useKYCStatus');

export type KYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired';

export interface KYCVerification {
  status: KYCStatus;
  verificationId: string | null;
  documents: { type: string; url: string }[];
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function useKYCStatus(userId: string) {
  const [status, setStatus] = useState<KYCStatus>('not_started');
  const [verification, setVerification] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from backend API directly to get full verification data
      const response = await fetch(`/api/kyc/status?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch KYC status');
      }

      const data = await response.json();
      const verificationData = data.data;

      if (verificationData) {
        setStatus(verificationData.status as KYCStatus);
        setVerification({
          status: verificationData.status as KYCStatus,
          verificationId: verificationData.verificationId,
          documents: verificationData.documents || [],
          notes: verificationData.notes,
          createdAt: verificationData.createdAt,
          updatedAt: verificationData.updatedAt,
        });
      } else {
        setStatus('not_started');
        setVerification(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch KYC status', error);
      setError(error);
      setStatus('not_started');
      setVerification(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void fetchStatus();
    }
  }, [userId, fetchStatus]);

  return {
    status,
    verification,
    loading,
    error,
    refetch: fetchStatus,
  };
}

