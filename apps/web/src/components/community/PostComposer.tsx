import { communityAPI } from '@/api/community-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useApp } from '@/contexts/AppContext'
import { useStorage } from '@/hooks/useStorage'
import type { PostKind, PostVisibility } from '@/lib/community-types'
import { haptics } from '@/lib/haptics'
import { uploadImage } from '@/lib/image-upload'
import { createLogger } from '@/lib/logger'
import type { Pet } from '@/lib/types'
import { VideoCompressor, type CompressionProgress, type VideoMetadata } from '@/lib/video-compression'
import type { Icon } from '@phosphor-icons/react'
import { Camera, CheckCircle, FilmSlate, Globe, Lock, Pause, Play, Sparkle, Tag, Users, VideoCamera, WarningCircle, X } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('PostComposer')

interface PostComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated?: () => void
}

const MAX_CHARS = 1000
const MAX_IMAGES = 10
const MAX_VIDEO_SIZE_MB = 50
const MAX_VIDEO_DURATION = 60

type MediaType = 'photo' | 'video'
type CropSize = 'square' | 'portrait' | 'landscape' | 'original'

// Image preview item component
function ImagePreviewItem({ 
  img, 
  index, 
  onRemove 
}: { 
  img: string
  index: number
  onRemove: () => void 
}) {
  const imageEntry = useEntryAnimation({ 
    initialScale: 0.8, 
    initialOpacity: 0,
    delay: index * 50 
  })
  
  return (
    <AnimatedView
      style={imageEntry.animatedStyle}
      className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
    >
      <img 
        src={img} 
        alt={`Upload ${String(index + 1 ?? '')}`}
        className="w-full h-full object-cover"
      />
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </AnimatedView>
  )
}

// Video play button with hover animation
function VideoPlayButton({ 
  isPlaying, 
  onClick 
}: { 
  isPlaying: boolean
  onClick: () => void 
}) {
  const hoverAnimation = useHoverAnimation({ scale: 1.1 })
  
  return (
    <AnimatedView
      style={hoverAnimation.animatedStyle}
      onMouseEnter={hoverAnimation.handleMouseEnter}
      onMouseLeave={hoverAnimation.handleMouseLeave}
      onMouseDown={hoverAnimation.handleMouseDown}
      onMouseUp={hoverAnimation.handleMouseUp}
      onClick={onClick}
      className="bg-white/90 hover:bg-white rounded-full p-4 shadow-2xl cursor-pointer"
    >
      {isPlaying ? (
        <Pause size={32} weight="fill" className="text-black" />
      ) : (
        <Play size={32} weight="fill" className="text-black" />
      )}
    </AnimatedView>
  )
}

// Crop size button with hover animation
function CropSizeButton({ 
  label, 
  icon, 
  desc, 
  isSelected, 
  onClick 
}: { 
  label: string
  icon: string
  desc?: string | undefined
  isSelected: boolean
  onClick: () => void 
}) {
  const hoverAnimation = useHoverAnimation({ scale: 1.02 })
  
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 transition-all text-left ${
        String(isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50' ?? '')
      }`}
      style={hoverAnimation.animatedStyle as React.CSSProperties}
      onMouseEnter={hoverAnimation.handleMouseEnter}
      onMouseLeave={hoverAnimation.handleMouseLeave}
      onMouseDown={hoverAnimation.handleMouseDown}
      onMouseUp={hoverAnimation.handleMouseUp}
    >
      <div className="text-xl mb-0.5">{icon}</div>
      <div className="text-xs font-medium">{label}</div>
      {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
    </button>
  )
}

interface VideoUploadState {
  file: File | null
  previewUrl: string | null
  thumbnailUrl: string | null
  compressedBlob: Blob | null
  metadata: VideoMetadata | null
  isCompressing: boolean
  compressionProgress: CompressionProgress | null
  error: string | null
}

export function PostComposer({ open, onOpenChange, onPostCreated }: PostComposerProps) {
  const { t } = useApp()
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videoState, setVideoState] = useState<VideoUploadState>({
    file: null,
    previewUrl: null,
    thumbnailUrl: null,
    compressedBlob: null,
    metadata: null,
    isCompressing: false,
    compressionProgress: null,
    error: null
  })
  const [selectedPets, setSelectedPets] = useState<string[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number; placeName?: string } | null>(null)
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userPets] = useStorage<Pet[]>('user-pets', [])
  const [mediaType, setMediaType] = useState<MediaType>('photo')
  const [cropSize, setCropSize] = useState<CropSize>('original')
  const [showMediaOptions, setShowMediaOptions] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const remainingChars = MAX_CHARS - text.length
  const canPost = text.trim().length > 0 && remainingChars >= 0 && !isSubmitting && !videoState.isCompressing

  const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (images.length >= MAX_IMAGES) {
      toast.error(t.community?.maxImagesReached || `Maximum ${String(MAX_IMAGES ?? '')} images allowed`)
      haptics.error()
      return
    }

    try {
      setIsUploadingImage(true)
      
      // Determine max dimensions based on crop size
      const aspectRatios = {
        square: { max: 800 },
        portrait: { max: 800 },
        landscape: { max: 1920 },
        original: { max: 1920 }
      }
      
      const maxDimension = aspectRatios[cropSize].max
      
      // Upload image with compression and EXIF stripping
      const result = await uploadImage(file, {
        maxWidthOrHeight: maxDimension,
        maxSizeMB: 1
      })

      setImages(prev => [...prev, result.url])
      haptics.selection()
      toast.success(t.community?.imageAdded || 'Image added')
      setShowMediaOptions(false)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to upload image', err)
      toast.error(err.message || 'Failed to upload image')
      haptics.error()
    } finally {
      setIsUploadingImage(false)
      // Reset file input
      if (isTruthy(imageInputRef.current)) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleImageUpload = (_crop?: CropSize) => {
    // Trigger file input click
    if (isTruthy(imageInputRef.current)) {
      imageInputRef.current.click()
    }
  }

  const handleVideoFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file')
      haptics.error()
      return
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_VIDEO_SIZE_MB * 2) {
      toast.error(`Video file is too large. Maximum size is ${String(MAX_VIDEO_SIZE_MB * 2 ?? '')}MB`)
      haptics.error()
      return
    }

    try {
      setVideoState(prev => ({ ...prev, isCompressing: true, error: null }))
      haptics.selection()

      const metadata = await VideoCompressor.getVideoMetadata(file)
      
      if (metadata.duration > MAX_VIDEO_DURATION) {
        toast.error(`Video must be less than ${String(MAX_VIDEO_DURATION ?? '')} seconds`)
        haptics.error()
        setVideoState(prev => ({ ...prev, isCompressing: false, error: 'Video too long' }))
        return
      }

      const thumbnailUrl = await VideoCompressor.extractThumbnail(file, metadata.duration / 2)
      const previewUrl = URL.createObjectURL(file)

      setVideoState(prev => ({
        ...prev,
        file,
        previewUrl,
        thumbnailUrl,
        metadata
      }))

      const compressedBlob = await VideoCompressor.compressVideo(
        file,
        {
          maxSizeMB: MAX_VIDEO_SIZE_MB,
          maxWidthOrHeight: 1280,
          maxDurationSeconds: MAX_VIDEO_DURATION,
          quality: 0.8
        },
        (progress) => {
          setVideoState(prev => ({ ...prev, compressionProgress: progress }))
        }
      )

      setVideoState(prev => ({
        ...prev,
        compressedBlob,
        isCompressing: false,
        compressionProgress: null
      }))

      setImages([])
      
      const originalSize = VideoCompressor.formatFileSize(file.size)
      const compressedSize = VideoCompressor.formatFileSize(compressedBlob.size)
      toast.success(`Video compressed: ${String(originalSize ?? '')} → ${String(compressedSize ?? '')}`)
      haptics.success()
      setShowMediaOptions(false)

    } catch (error) {
      logger.error('Video processing error', error instanceof Error ? error : new Error(String(error)))
      setVideoState({
        file: null,
        previewUrl: null,
        thumbnailUrl: null,
        compressedBlob: null,
        metadata: null,
        isCompressing: false,
        compressionProgress: null,
        error: error instanceof Error ? error.message : 'Failed to process video'
      })
      toast.error('Failed to process video')
      haptics.error()
    }
  }

  const handleVideoUploadClick = () => {
    videoInputRef.current?.click()
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    haptics.light()
  }

  const handleRemoveVideo = () => {
    if (isTruthy(videoState.previewUrl)) {
      URL.revokeObjectURL(videoState.previewUrl)
    }
    setVideoState({
      file: null,
      previewUrl: null,
      thumbnailUrl: null,
      compressedBlob: null,
      metadata: null,
      isCompressing: false,
      compressionProgress: null,
      error: null
    })
    haptics.light()
  }

  const toggleVideoPlayback = () => {
    if (!videoPreviewRef.current) return
    
    if (isTruthy(isVideoPlaying)) {
      videoPreviewRef.current.pause()
    } else {
      videoPreviewRef.current.play()
    }
    setIsVideoPlaying(!isVideoPlaying)
    haptics.light()
  }

  const handleAddTag = () => {
    if (!tagInput.trim()) return
    if (tags.length >= 10) {
      toast.error(t.community?.maxTagsReached || 'Maximum 10 tags allowed')
      return
    }
    
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '_')
    if (!tags.includes(tag)) {
      setTags(prev => [...prev, tag])
      haptics.selection()
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
    haptics.light()
  }

  const handleSubmit = async () => {
    if (!canPost) return

    try {
      setIsSubmitting(true)
      haptics.impact()

      const user = await spark.user()
      
      // All posts require manual admin approval
      toast.info('Your post has been submitted and will be visible once approved by an administrator.')
      
      const postData: Parameters<typeof communityAPI.createPost>[0] = {
        authorId: user.id,
        authorName: user.login || 'User',
        authorAvatar: user.avatarUrl,
        kind: 'post' as PostKind,
        text: text.trim(),
        media: videoState.file ? [] : images,
        visibility
      }
      if (tags.length > 0) {
        postData.tags = tags
      }
      if (isTruthy(location)) {
        postData.location = {
          city: location.placeName?.split(',')[0] || 'Unknown',
          country: location.placeName?.split(',').pop()?.trim() || 'Unknown',
          lat: location.lat,
          lon: location.lng
        }
      }
      await communityAPI.createPost(postData)
      
      haptics.success()
      toast.success(t.community?.postCreated || 'Post created successfully!')
      
      setText('')
      setImages([])
      handleRemoveVideo()
      setSelectedPets([])
      setLocation(null)
      setTags([])
      setVisibility('public')
      setCropSize('original')
      setShowMediaOptions(false)
      
      onPostCreated?.()
      onOpenChange(false)
    } catch (error) {
      haptics.error()
      toast.error(t.community?.postFailed || 'Failed to create post')
      logger.error('Post creation failed', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  const visibilityOptions: { value: PostVisibility; icon: Icon; label: string }[] = [
    { value: 'public', icon: Globe, label: t.community?.visibilityPublic || 'Public' },
    { value: 'matches', icon: Users, label: t.community?.visibilityMatches || 'Matches Only' },
    { value: 'private', icon: Lock, label: t.community?.visibilityPrivate || 'Private' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Hidden file input for image upload */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImageFileSelect}
          disabled={isUploadingImage}
        />
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t.community?.createPost || 'Create Post'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Text Area */}
          <div>
            <Textarea
              placeholder={t.community?.postPlaceholder || "Share what's on your mind..."}
              value={text}
              onChange={(e) => { setText(e.target.value); }}
              className="min-h-[120px] resize-none text-base"
              maxLength={MAX_CHARS}
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${String(remainingChars < 50 ? 'text-destructive' : 'text-muted-foreground' ?? '')}`}>
                {remainingChars} {t.community?.charsRemaining || 'characters remaining'}
              </span>
            </div>
          </div>

          {/* Image Preview */}
          {(() => {
            const imagesPresence = useAnimatePresence({ isVisible: images.length > 0 })
            return imagesPresence.shouldRender && images.length > 0 ? (
              <AnimatedView
                style={imagesPresence.animatedStyle}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Photos ({images.length}/{MAX_IMAGES})</Label>
                  <Badge variant="outline" className="text-xs capitalize">{cropSize}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <ImagePreviewItem
                      key={index}
                      img={img}
                      index={index}
                      onRemove={() => { handleRemoveImage(index); }}
                    />
                  ))}
                </div>
              </AnimatedView>
            ) : null
          })()}

          {/* Video Preview */}
          {(() => {
            const videoPresence = useAnimatePresence({ isVisible: !!videoState.previewUrl })
            return videoPresence.shouldRender && videoState.previewUrl ? (
              <AnimatedView
                style={videoPresence.animatedStyle}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <VideoCamera size={16} weight="bold" />
                    Video Preview
                  </Label>
                  {videoState.metadata && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="gap-1">
                        <FilmSlate size={12} />
                        {VideoCompressor.formatDuration(videoState.metadata.duration)}
                      </Badge>
                      <Badge variant="outline">
                        {videoState.metadata.width}×{videoState.metadata.height}
                      </Badge>
                      {videoState.compressedBlob && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle size={12} weight="fill" />
                          {VideoCompressor.formatFileSize(videoState.compressedBlob.size)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {videoState.isCompressing && videoState.compressionProgress && (() => {
                  const progressAnimation = useEntryAnimation({ initialY: -10, initialOpacity: 0 })
                  return (
                    <AnimatedView
                      style={progressAnimation.animatedStyle}
                      className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-primary">
                          {videoState.compressionProgress.message}
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round(videoState.compressionProgress.progress)}%
                        </span>
                      </div>
                      <Progress value={videoState.compressionProgress.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Stage: {videoState.compressionProgress.stage}
                      </div>
                    </AnimatedView>
                  )
                })()}

                {videoState.error && (() => {
                  const errorAnimation = useEntryAnimation({ initialY: -10, initialOpacity: 0 })
                  return (
                    <AnimatedView
                      style={errorAnimation.animatedStyle}
                      className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2"
                    >
                      <WarningCircle size={20} weight="fill" className="text-destructive shrink-0 mt-0.5" />
                      <div className="text-sm text-destructive">
                        {videoState.error}
                      </div>
                    </AnimatedView>
                  )
                })()}

                <div className="relative aspect-video rounded-lg overflow-hidden bg-black group">
                  <video 
                    ref={videoPreviewRef}
                    src={videoState.previewUrl} 
                    className="w-full h-full object-contain"
                    onPlay={() => { setIsVideoPlaying(true); }}
                    onPause={() => { setIsVideoPlaying(false); }}
                    onEnded={() => { setIsVideoPlaying(false); }}
                    loop
                  />
                  
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <VideoPlayButton
                      isPlaying={isVideoPlaying}
                      onClick={toggleVideoPlayback}
                    />
                  </div>

                  <button
                    onClick={handleRemoveVideo}
                    className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={videoState.isCompressing}
                  >
                    <X size={20} />
                  </button>

                  {videoState.isCompressing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center space-y-2">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto" />
                        <div className="text-sm font-medium">Processing...</div>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedView>
            ) : null
          })()}

          {/* Media Options Popup */}
          {(() => {
            const mediaOptionsPresence = useAnimatePresence({ 
              isVisible: showMediaOptions,
              enterTransition: 'scale',
              exitTransition: 'scale'
            })
            return mediaOptionsPresence.shouldRender && showMediaOptions ? (
              <AnimatedView
                style={mediaOptionsPresence.animatedStyle}
                className="border rounded-lg p-4 bg-card space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Add Media</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowMediaOptions(false); }}
                    className="h-8 w-8 p-0"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <Tabs value={mediaType} onValueChange={(v) => { setMediaType(v as MediaType); }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="photo" className="gap-2">
                      <Camera size={16} />
                      Photo
                    </TabsTrigger>
                    <TabsTrigger value="video" className="gap-2">
                      <VideoCamera size={16} />
                      Video
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="photo" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-sm mb-2 block">Crop Size</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'original', label: 'Original', icon: '📐' },
                          { value: 'square', label: 'Square', icon: '⬜', desc: '1:1' },
                          { value: 'portrait', label: 'Portrait', icon: '📱', desc: '3:4' },
                          { value: 'landscape', label: 'Landscape', icon: '🖼️', desc: '4:3' }
                        ].map(({ value, label, icon, desc }) => (
                          <CropSizeButton
                            key={value}
                            value={value}
                            label={label}
                            icon={icon}
                            desc={desc}
                            isSelected={cropSize === value}
                            onClick={() => { setCropSize(value as CropSize); }}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => { handleImageUpload(); }}
                      className="w-full"
                      disabled={images.length >= MAX_IMAGES}
                    >
                      <Camera size={18} className="mr-2" />
                      Add Photo
                    </Button>
                  </TabsContent>

                  <TabsContent value="video" className="space-y-4 mt-4">
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Sparkle size={16} weight="duotone" className="text-accent shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <div className="font-medium mb-1">Video Guidelines</div>
                          <ul className="text-muted-foreground space-y-0.5">
                            <li>• Max size: {MAX_VIDEO_SIZE_MB}MB (compressed)</li>
                            <li>• Formats: MP4, MOV, WebM</li>
                            <li>• Max duration: {MAX_VIDEO_DURATION} seconds</li>
                            <li>• Auto-compression enabled</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileSelect}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={handleVideoUploadClick}
                      className="w-full"
                      disabled={!!videoState.file || videoState.isCompressing}
                    >
                      <VideoCamera size={18} className="mr-2" />
                      {videoState.isCompressing ? 'Processing...' : 'Choose Video'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </AnimatedView>
            ) : null
          })()}

          {/* Tag pets */}
          {userPets && userPets.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t.community?.tagPets || 'Tag Your Pets'}
              </label>
              <div className="flex flex-wrap gap-2">
                {userPets.map(pet => {
                  const isSelected = selectedPets.includes(pet.id)
                  return (
                    <Badge
                      key={pet.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedPets(prev =>
                          isSelected ? prev.filter(id => id !== pet.id) : [...prev, pet.id]
                        )
                        haptics.selection()
                      }}
                    >
                      {pet.name}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t.community?.tags || 'Tags'} ({tags.length}/10)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder={t.community?.addTag || 'Add tag...'}
                className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md"
              />
              <Button onClick={handleAddTag} variant="outline" size="sm">
                <Tag size={16} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button onClick={() => { handleRemoveTag(tag); }} className="hover:text-destructive">
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t.community?.visibility || 'Visibility'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {visibilityOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setVisibility(value)
                    haptics.selection()
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    String(visibility === value
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50' ?? '')
                  }`}
                >
                  <Icon size={24} className="mx-auto mb-1" weight={visibility === value ? 'fill' : 'regular'} />
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowMediaOptions(!showMediaOptions); }}
              className="gap-2"
            >
              {showMediaOptions ? (
                <>
                  <X size={18} />
                  Close
                </>
              ) : (
                <>
                  <Camera size={18} />
                  Media
                </>
              )}
            </Button>
            
            <div className="flex-1" />
            
            <Button variant="ghost" onClick={() => { onOpenChange(false); }}>
              {t.common?.cancel || 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={!canPost}>
              {isSubmitting ? (t.common?.posting || 'Posting...') : (t.common?.post || 'Post')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
