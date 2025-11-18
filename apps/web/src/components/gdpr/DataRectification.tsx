/**
 * Data Rectification Component
 *
 * Allows users to request correction of their personal data (GDPR Right to Rectification).
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getGDPRService } from '@/lib/privacy/gdpr';
import { gdprApi } from '@/api/gdpr-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DataRectification');

interface DataRectificationProps {
  userId: string;
  onRectificationComplete?: () => void;
}

export function DataRectification({ userId, onRectificationComplete }: DataRectificationProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [rectificationError, setRectificationError] = useState<string | null>(null);
  const [rectificationSuccess, setRectificationSuccess] = useState(false);

  // Add correction field
  const handleAddCorrection = useCallback((): void => {
    if (fieldName.trim() && fieldValue.trim()) {
      setCorrections({
        ...corrections,
        [fieldName.trim()]: fieldValue.trim(),
      });
      setFieldName('');
      setFieldValue('');
    }
  }, [fieldName, fieldValue, corrections]);

  // Remove correction field
  const handleRemoveCorrection = useCallback((key: string): void => {
    const newCorrections = { ...corrections };
    delete newCorrections[key];
    setCorrections(newCorrections);
  }, [corrections]);

  // Handle rectification request
  const handleSubmit = async (): Promise<void> => {
    if (Object.keys(corrections).length === 0) {
      setRectificationError('Please add at least one correction');
      return;
    }

    try {
      setIsSubmitting(true);
      setRectificationError(null);
      setRectificationSuccess(false);

      const gdprService = getGDPRService();
      await gdprService.requestDataRectification(userId, corrections);

      // Also submit via API
      await gdprApi.requestDataRectification({
        userId,
        corrections,
        reason: reason.trim() || undefined,
      });

      setRectificationSuccess(true);
      setCorrections({});
      setReason('');
      onRectificationComplete?.();

      // Reset success message after 5 seconds
      setTimeout(() => {
        setRectificationSuccess(false);
      }, 5000);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to submit data rectification request', err, { userId });
      setRectificationError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Data Correction</CardTitle>
        <CardDescription>
          Request correction of inaccurate or incomplete personal data (GDPR Right to Rectification).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            If you believe any of your personal data is inaccurate or incomplete, you can request corrections.
            Common fields that can be corrected include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
            <li>Name, email address, phone number</li>
            <li>Profile information and preferences</li>
            <li>Location and address information</li>
            <li>Pet profile information</li>
            <li>Other personal data stored in your account</li>
          </ul>
        </div>

        {/* Add Correction Fields */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Add Correction</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Field name (e.g., email, name)"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              disabled={isSubmitting}
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Correct value"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleAddCorrection()}
              disabled={isSubmitting || !fieldName.trim() || !fieldValue.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Corrections List */}
        {Object.keys(corrections).length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Requested Corrections</label>
            <div className="space-y-2">
              {Object.entries(corrections).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <span className="text-sm font-medium">{key}:</span>
                    <span className="text-sm text-muted-foreground ml-2">{value}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCorrection(key)}
                    disabled={isSubmitting}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reason (Optional) */}
        <div>
          <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
          <Textarea
            placeholder="Please provide any additional context for these corrections..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {rectificationError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Error: {rectificationError}</p>
          </div>
        )}

        {rectificationSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-600">
              Data rectification request submitted successfully! We will review your request and update your data accordingly.
            </p>
          </div>
        )}

        <Button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || Object.keys(corrections).length === 0}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Correction Request'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Your request will be reviewed by our team. We typically process rectification requests within 30 days.
        </p>
      </CardContent>
    </Card>
  );
}
