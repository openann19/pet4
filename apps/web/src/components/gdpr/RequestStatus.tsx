/**
 * Request Status Component
 *
 * Displays the status of GDPR data subject requests (access, rectification, erasure, portability).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getGDPRService } from '@/lib/privacy/gdpr';
import { gdprApi, type DataSubjectRequestStatus } from '@/api/gdpr-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('RequestStatus');

interface RequestStatusProps {
  userId: string;
  onRefresh?: () => void;
}

/**
 * Get status badge color
 */
function getStatusColor(status: DataSubjectRequestStatus['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
}

/**
 * Get right label
 */
function getRightLabel(right: DataSubjectRequestStatus['right']): string {
  switch (right) {
    case 'access':
      return 'Right to Access';
    case 'rectification':
      return 'Right to Rectification';
    case 'erasure':
      return 'Right to Erasure';
    case 'portability':
      return 'Right to Data Portability';
    default:
      return right;
  }
}

export function RequestStatus({ userId, onRefresh }: RequestStatusProps): React.JSX.Element {
  const [requests, setRequests] = useState<DataSubjectRequestStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch requests
  const fetchRequests = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from API
      const apiRequests = await gdprApi.getUserRequests(userId);
      setRequests(apiRequests);

      // Also sync with GDPR service
      const gdprService = getGDPRService();
      await gdprService.fetchRequestStatus(userId);

      logger.debug('Requests fetched', { userId, count: apiRequests.length });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch requests', error, { userId });
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load requests on mount and when userId changes
  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  // Refresh handler
  const handleRefresh = useCallback((): void => {
    void fetchRequests();
    onRefresh?.();
  }, [fetchRequests, onRefresh]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Error: {error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Request Status</CardTitle>
          <CardDescription>View the status of your GDPR data subject requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No requests found.</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-4">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Request Status</CardTitle>
            <CardDescription>View the status of your GDPR data subject requests.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="p-4 border rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{getRightLabel(request.right)}</h3>
                <p className="text-sm text-muted-foreground">
                  Request ID: {request.id}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(request.status)}`}
              >
                {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('-', ' ')}
              </span>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Requested: {new Date(request.requestedAt).toLocaleString()}</p>
              {request.completedAt && (
                <p>Completed: {new Date(request.completedAt).toLocaleString()}</p>
              )}
              {request.reason && (
                <p>Reason: {request.reason}</p>
              )}
            </div>

            {request.status === 'completed' && request.right === 'access' && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                Your data export is ready. Please check your downloads or request a new export.
              </div>
            )}

            {request.status === 'rejected' && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                Your request was rejected. Please contact support for more information.
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
