/**
 * Appeal Dialog Component
 * Allows users to appeal moderation decisions
 */

import { communityAPI } from '@/api/community-api';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Textarea } from '@/components/ui/textarea';
import { haptics } from '@/lib/haptics';
import { userService } from '@/lib/user-service';
import { FileText, Scales } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AppealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: 'post' | 'comment' | 'user';
  resourceId: string;
  reportId?: string;
  moderationReason?: string;
  onAppealed?: () => void;
}

export function AppealDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  reportId,
  moderationReason,
  onAppealed,
}: AppealDialogProps) {
  const [appealText, setAppealText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (appealText.trim().length < 50) {
      toast.error('Please provide more details (at least 50 characters)');
      return;
    }

    setIsSubmitting(true);
    haptics.trigger('medium');

    try {
      const user = await userService.user();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      await communityAPI.appealModeration(
        resourceId,
        resourceType,
        user.id,
        user.login || 'User',
        appealText.trim(),
        reportId
      );

      toast.success('Appeal submitted successfully. Our team will review it within 24-48 hours.', {
        duration: 4000,
      });

      onAppealed?.();
      handleClose();
    } catch (error) {
      toast.error('Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAppealText('');
    onOpenChange(false);
  };

  const resourceLabel =
    resourceType === 'post' ? 'post' : resourceType === 'comment' ? 'comment' : 'account';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125" aria-describedby="appeal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scales className="w-5 h-5 text-primary" />
            Appeal Moderation Decision
          </DialogTitle>
          <DialogDescription id="appeal-description">
            If you believe this {resourceLabel} was incorrectly moderated, you can submit an appeal
            for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {moderationReason && (
            <Alert>
              <AlertDescription>
                <strong>Moderation Reason:</strong> {moderationReason}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="appeal-text">
              Explain why you believe this was incorrectly moderated
              <span className="text-muted-foreground"> (minimum 50 characters)</span>
            </Label>
            <Textarea
              id="appeal-text"
              value={appealText}
              onChange={(e) => { setAppealText(e.target.value); }}
              placeholder="Please provide detailed information about why you believe this content should be restored. Include any relevant context or evidence..."
              rows={6}
              className="resize-none"
              aria-label="Appeal explanation"
              aria-describedby="appeal-help"
            />
            <div id="appeal-help" className="text-sm text-muted-foreground">
              {appealText.length}/50 characters minimum
              {appealText.length >= 50 && <span className="text-green-600 ml-2">✓</span>}
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>What happens next?</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Your appeal will be reviewed by our moderation team</li>
                  <li>Review typically takes 24-48 hours</li>
                  <li>You'll receive a notification when a decision is made</li>
                  <li>If approved, the content will be restored</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <span className="sr-only">Cancel appeal</span>
            <span aria-hidden="true">Cancel</span>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!appealText.trim() || appealText.trim().length < 50 || isSubmitting}
            aria-label="Submit appeal"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
