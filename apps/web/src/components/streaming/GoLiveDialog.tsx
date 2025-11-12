import { liveStreamingAPI } from '@/api/live-streaming-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { LiveStreamCategory } from '@/lib/live-streaming-types';
import { createLogger } from '@/lib/logger';
import { ChatCircle, Tag, VideoCamera, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('GoLiveDialog');

interface GoLiveDialogProps {
  open: boolean;
  onClose: () => void;
  onGoLive: (streamId: string) => void;
}

const CATEGORIES: { value: LiveStreamCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'training', label: 'Training' },
  { value: 'health', label: 'Health & Care' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Education & Q&A' },
  { value: 'adoption', label: 'Adoption' },
  { value: 'community', label: 'Community & Playdates' },
];

const DURATION_OPTIONS = [
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 7200, label: '2 hours' },
  { value: 14400, label: '4 hours' },
];

export function GoLiveDialog({ open, onClose, onGoLive }: GoLiveDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LiveStreamCategory>('general');
  const [allowChat, setAllowChat] = useState(true);
  const [maxDuration, setMaxDuration] = useState(3600);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleGoLive = async () => {
    if (!title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    try {
      setIsCreating(true);

      const user = await spark.user();

      const result = await liveStreamingAPI.createRoom({
        hostId: user.id,
        hostName: user.login || 'User',
        hostAvatar: user.avatarUrl,
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        category,
        allowChat,
        maxDuration,
      });

      toast.success('Going live!');
      onGoLive(result.stream.id);
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : undefined;
      logger.error(
        'Failed to create stream',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error(errorMessage || 'Failed to start stream. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <VideoCamera size={24} className="text-primary" weight="duotone" />
            Go Live
          </DialogTitle>
          <DialogDescription>
            Start a live stream and connect with the community in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Stream Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Training my Golden Retriever!"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what your stream is about..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as LiveStreamCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDuration">Max Duration</Label>
              <Select
                value={maxDuration.toString()}
                onValueChange={(v) => setMaxDuration(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                disabled={tags.length >= 5}
              />
              <Button type="button" onClick={addTag} disabled={tags.length >= 5} variant="outline">
                <Tag size={16} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <button 
                      onClick={() => removeTag(index)}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
                      aria-label="Remove tag"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{tags.length}/5 tags</p>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
            <Checkbox
              id="allowChat"
              checked={allowChat}
              onCheckedChange={(checked) => setAllowChat(!!checked)}
            />
            <Label htmlFor="allowChat" className="cursor-pointer flex items-center gap-2">
              <ChatCircle size={18} />
              Allow viewers to chat
            </Label>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <VideoCamera size={16} className="text-primary" />
              Live Streaming Tips
            </h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Make sure you have a stable internet connection</li>
              <li>• Choose a well-lit environment</li>
              <li>• Test your audio before going live</li>
              <li>• Interact with your viewers in real-time</li>
              <li>• Keep content family-friendly and follow community guidelines</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleGoLive} disabled={isCreating || !title.trim()}>
            {isCreating ? 'Starting...' : 'Go Live'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
