/**
 * Report Dialog Component
 * Allows users to report posts, comments, or users with moderation reasons
 */

import { communityAPI } from '@/api/community-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { ReportReason } from '@/lib/community-types';
import { haptics } from '@/lib/haptics';
import { userService } from '@/lib/user-service';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { MotionView } from '@petspark/motion';
import { Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: 'post' | 'comment' | 'user';
  resourceId: string;
  resourceName?: string;
  onReported?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'Spam', description: 'Repetitive, unwanted, or promotional content' },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Bullying, threats, or personal attacks',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Content that violates community guidelines',
  },
  {
    value: 'misleading',
    label: 'Misleading Information',
    description: 'False or deceptive information',
  },
  { value: 'violence', label: 'Violence', description: 'Depicts or promotes violence' },
  {
    value: 'hate-speech',
    label: 'Hate Speech',
    description: 'Discriminatory or offensive language',
  },
  {
    value: 'copyright',
    label: 'Copyright Violation',
    description: 'Unauthorized use of copyrighted material',
  },
  { value: 'other', label: 'Other', description: 'Other reason not listed above' },
];

export function ReportDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
  onReported,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const transitionConfig = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const };

  const handleSubmit = async () => {
    if (!selectedReason) {
      void toast.error('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    haptics.trigger('medium');

    try {
      const user = await userService.user();
      if (!user) {
        void toast.error('User not authenticated');
        return;
      }
      const reportData: Parameters<typeof communityAPI.reportContent>[0] = {
        resourceType,
        resourceId,
        reason: selectedReason,
        reporterId: user.id,
      };
      const trimmedDetails = details.trim();
      if (trimmedDetails) {
        reportData.details = trimmedDetails;
      }
      await communityAPI.reportContent(reportData);

      void toast.success('Report submitted successfully. Our team will review it.', {
                duration: 3000,
              });

      onReported?.();
      handleClose();
    } catch {
      void toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    onOpenChange(false);
  };

  const resourceLabel =
    resourceType === 'post' ? 'post' : resourceType === 'comment' ? 'comment' : 'user';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125" aria-describedby="report-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warning className="w-5 h-5 text-destructive" />
            Report {resourceLabel.charAt(0).toUpperCase() + resourceLabel.slice(1)}
          </DialogTitle>
          <DialogDescription id="report-description">
            {resourceName && (
              <span className="block mb-2">
                Reporting: <strong>{resourceName}</strong>
              </span>
            )}
            Help us maintain a safe community by reporting content that violates our guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason for reporting</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={(value) => { setSelectedReason(value as ReportReason); }}
              id="report-reason"
              aria-label="Select report reason"
            >
              {REPORT_REASONS.map((reason) => (
                <MotionView
                  key={reason.value}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
                  transition={transitionConfig}
                >
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-1" />
                  <Label htmlFor={reason.value} className="flex-1 cursor-pointer space-y-1">
                    <div className="font-medium">{reason.label}</div>
                    <div className="text-sm text-muted-foreground">{reason.description}</div>
                  </Label>
                </MotionView>
              ))}
            </RadioGroup>
          </div>

          {selectedReason && (
            <MotionView
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={transitionConfig}
              className="space-y-2"
            >
              <Label htmlFor="report-details">
                Additional details <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="report-details"
                value={details}
                onChange={(e) => { setDetails(e.target.value); }}
                placeholder="Provide any additional information that might help our review..."
                rows={4}
                className="resize-none"
                aria-label="Additional details for report"
              />
            </MotionView>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Cancel report"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!selectedReason || isSubmitting}
            className="bg-destructive hover:bg-destructive/90"
            aria-label="Submit report"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
