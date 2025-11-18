/**
 * Go Live Dialog
 *
 * Stream setup dialog for going live
 */

'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { PremiumFeatureGate } from '@/components/billing/PremiumFeatureGate';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';

export interface GoLiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoLive: (config: {
    title: string;
    description?: string;
    category?: string;
  }) => void;
}

export function GoLiveDialog({
  open,
  onOpenChange,
  onGoLive,
}: GoLiveDialogProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const handleGoLive = useCallback(() => {
    if (!title.trim()) {
      return;
    }

    onGoLive({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category ?? undefined,
    });
    setTitle('');
    setDescription('');
    setCategory('');
    onOpenChange(false);
  }, [title, description, category, onGoLive, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={cn(getTypographyClasses('h2'))}>Go Live</DialogTitle>
        </DialogHeader>

        <PremiumFeatureGate requiredTier="pro">
          <PremiumCard variant="glass" className="p-4 space-y-4">
            <div>
              <Label htmlFor="title" className={getTypographyClasses('body')}>
                Stream Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Playing at the dog park"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className={getTypographyClasses('body')}>
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers what you're doing..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category" className={getTypographyClasses('body')}>
                Category (optional)
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Pet Care, Training"
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleGoLive()}
                disabled={!title.trim()}
                className="flex-1"
              >
                Go Live
              </Button>
            </div>
          </PremiumCard>
        </PremiumFeatureGate>
      </DialogContent>
    </Dialog>
  );
}
