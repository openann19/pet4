/**
 * Age Gate Modal Component
 *
 * Verifies user age before allowing sign-up.
 */

import { useState } from 'react';
import { MotionView, Presence } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { recordAgeVerification } from '@/lib/kyc-service';
import { useStorage } from '@/hooks/use-storage';
import { createLogger } from '@/lib/logger';

interface AgeGateModalProps {
  open: boolean;
  onVerified: (country?: string) => void;
  onClose?: () => void;
}

const MIN_AGE = 18;

export default function AgeGateModal({ open, onVerified, onClose }: AgeGateModalProps) {
  const { t } = useApp();
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useStorage<string>('user-id', '');

  const calculateAge = (date: string): number => {
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const handleVerify = async () => {
    if (!birthDate) {
      setError(t.auth?.birthDateRequired || 'Please enter your birth date');
      haptics.trigger('error');
      return;
    }

    const age = calculateAge(birthDate);

    if (age < MIN_AGE) {
      setError(t.auth?.ageTooYoung || `You must be at least ${MIN_AGE} years old to use this app`);
      haptics.trigger('error');
      return;
    }

    setIsLoading(true);
    haptics.trigger('light');

    try {
      // Record age verification
      if (userId) {
        await recordAgeVerification(userId, true, country || undefined);
      }

      haptics.trigger('success');
      onVerified(country || undefined);
    } catch (error) {
      const logger = createLogger('AgeGateModal');
      logger.error(
        'Age verification error',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t.auth?.verificationError || 'Verification failed. Please try again.');
      haptics.trigger('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Presence visible={open}>
      <MotionView
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm"
      >
        <MotionView
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t.auth?.ageVerificationTitle || 'Age Verification'}
          </h2>

          <p className="text-muted-foreground mb-6">
            {t.auth?.ageVerificationDesc ||
              `You must be at least ${MIN_AGE} years old to use PawfectMatch.`}
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">{t.auth?.birthDate || 'Date of Birth'}</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  setError(null);
                }}
                max={
                  new Date(new Date().setFullYear(new Date().getFullYear() - MIN_AGE))
                    .toISOString()
                    .split('T')[0]
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t.auth?.country || 'Country (Optional)'}</Label>
              <Input
                id="country"
                type="text"
                placeholder={t.auth?.countryPlaceholder || 'e.g., United States'}
                value={country}
                onChange={(e) => { setCountry(e.target.value); }}
                className="w-full"
              />
            </div>

            {error && (
              <MotionView
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm"
              >
                {error}
              </MotionView>
            )}

            <div className="flex gap-3 pt-2">
              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {t.common.cancel || 'Cancel'}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => { void handleVerify(); }}
                disabled={isLoading || !birthDate}
                className="flex-1"
              >
                {isLoading ? t.common.loading || 'Loading...' : t.auth?.verify || 'Verify'}
              </Button>
            </div>
          </div>
        </MotionView>
      </MotionView>
    </Presence>
  );
}
