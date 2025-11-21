import { useState, useRef } from 'react';
import { motion } from '@petspark/motion';
import { Camera, Image as ImageIcon, X, Smiley, MapPin } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Story, StoryVisibility } from '@petspark/shared';
import { STORY_MUSIC_TRACKS } from '@petspark/shared';
import { ADVANCED_STORY_TEMPLATES, STORY_FILTERS } from '@/lib/story-templates';
import type { AdvancedTemplate, StoryFilter } from '@/lib/story-templates';
import { createStory } from '@/lib/stories-utils';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';
import StoryTemplateSelector from './StoryTemplateSelector';
import StoryFilterSelector from './StoryFilterSelector';

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  petId: string;
  petName: string;
  petPhoto: string;
  userAvatar?: string;
  onStoryCreated: (story: Story) => void;
}

export default function CreateStoryDialog({
  open,
  onOpenChange,
  userId,
  userName,
  petId,
  petName,
  petPhoto,
  userAvatar,
  onStoryCreated,
}: CreateStoryDialogProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<StoryVisibility>('everyone');
  const [selectedTemplate, setSelectedTemplate] = useState<AdvancedTemplate>(() => {
    const firstTemplate = ADVANCED_STORY_TEMPLATES[0];
    if (!firstTemplate) {
      throw new Error('ADVANCED_STORY_TEMPLATES array is empty');
    }
    return firstTemplate;
  });
  const [selectedFilter, setSelectedFilter] = useState<StoryFilter>(() => {
    const firstFilter = STORY_FILTERS[0];
    if (!firstFilter) {
      throw new Error('STORY_FILTERS array is empty');
    }
    return firstFilter;
  });
  const [filterIntensity, setFilterIntensity] = useState(1);
  const [selectedMusic, setSelectedMusic] = useState(() => {
    const firstMusic = STORY_MUSIC_TRACKS[0];
    if (!firstMusic) {
      throw new Error('STORY_MUSIC_TRACKS array is empty');
    }
    return firstMusic;
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'photo');
    setMediaFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  const handleCreate = async () => {
    if (!mediaPreview) {
      toast.error('Please select a photo or video');
      return;
    }

    setIsProcessing(true);
    haptics.trigger('success');

    try {
      const newStory = createStory(
        userId,
        userName,
        petId,
        petName,
        petPhoto,
        mediaPreview,
        mediaType,
        visibility,
        userAvatar
      );

      if (caption) {
        newStory.caption = caption;
      }

      if (selectedTemplate.id !== 'template-classic') {
        newStory.template = selectedTemplate;
      }

      if (selectedMusic && selectedMusic.id !== 'music-1') {
        newStory.music = {
          id: selectedMusic.id,
          title: selectedMusic.title ?? '',
          artist: selectedMusic.artist ?? '',
          provider: selectedMusic.provider ?? 'licensed',
          duration: selectedMusic.duration ?? 30,
          previewUrl: selectedMusic.previewUrl ?? '',
          startTime: 0,
        };
      }

      onStoryCreated(newStory);

      toast.success('Story created!', {
        description: 'Your story is now live for 24 hours',
        duration: 3000,
      });

      handleClose();
    } catch (error) {
      toast.error('Failed to create story');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setMediaFile(null);
    setMediaPreview('');
    setCaption('');
    setVisibility('everyone');
    onOpenChange(false);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden glass-strong">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {!mediaPreview ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      onClick={handleCameraCapture}
                      className="glass-effect p-8 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
                        <Camera size={32} weight="fill" className="text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Take Photo</p>
                        <p className="text-xs text-muted-foreground">Use your camera</p>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={handleGallerySelect}
                      className="glass-effect p-8 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-16 h-16 rounded-full bg-linear-to-br from-secondary to-primary flex items-center justify-center">
                        <ImageIcon size={32} weight="fill" className="text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Choose Media</p>
                        <p className="text-xs text-muted-foreground">From your gallery</p>
                      </div>
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-9/16 max-h-96 bg-black rounded-2xl overflow-hidden">
                    {mediaType === 'photo' ? (
                      <ProgressiveImage
                        src={mediaPreview}
                        alt="Story preview"
                        className="w-full h-full object-contain"
                        aria-label="Story preview image"
                      />
                    ) : (
                      <video src={mediaPreview} className="w-full h-full object-contain" controls />
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveMedia}
                      aria-label="Remove media"
                    >
                      <X size={20} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption (optional)</Label>
                    <Textarea
                      id="caption"
                      value={caption}
                      onChange={(e) => { setCaption(e.target.value); }}
                      placeholder="Add a caption to your story..."
                      rows={3}
                      maxLength={150}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">{caption.length}/150</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <StoryTemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <StoryFilterSelector
                selectedFilter={selectedFilter}
                onSelectFilter={setSelectedFilter}
                mediaPreview={mediaPreview}
                intensity={filterIntensity}
                onIntensityChange={setFilterIntensity}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-3">
                <Label>Privacy</Label>
                <RadioGroup
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as StoryVisibility)}
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg glass-effect">
                    <RadioGroupItem value="everyone" id="everyone" />
                    <Label htmlFor="everyone" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Everyone</div>
                      <p className="text-xs text-muted-foreground">
                        All PawfectMatch users can view
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg glass-effect">
                    <RadioGroupItem value="matches-only" id="matches-only" />
                    <Label htmlFor="matches-only" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Matches Only</div>
                      <p className="text-xs text-muted-foreground">Only your matches can view</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg glass-effect">
                    <RadioGroupItem value="close-friends" id="close-friends" />
                    <Label htmlFor="close-friends" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Close Friends</div>
                      <p className="text-xs text-muted-foreground">Only close friends can view</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="glass-effect p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={16} />
                  <span className="text-sm">Your story will expire in 24 hours</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Smiley size={16} />
                  <span className="text-sm">Viewers can react and reply to your story</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!mediaPreview || isProcessing}
              className="bg-linear-to-r from-primary to-accent"
            >
              {isProcessing ? 'Creating...' : 'Share Story'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
