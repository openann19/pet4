import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { buildLLMPrompt } from '@/lib/llm-prompt';
import { llmService } from '@/lib/llm-service';
import { parseLLMError } from '@/lib/llm-utils';
import { createLogger } from '@/lib/logger';
import { Camera, Check, Image as ImageIcon, Sparkle, Upload, X } from '@phosphor-icons/react';
import { useRef, useState, useEffect } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { toast } from 'sonner';

const logger = createLogger('PetPhotoAnalyzer');

interface AnalysisResult {
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large' | 'extra-large';
  personality: string[];
  confidence: number;
}

interface PetPhotoAnalyzerProps {
  onAnalysisComplete: (result: AnalysisResult & { photo: string }) => void;
}

export default function PetPhotoAnalyzer({ onAnalysisComplete }: PetPhotoAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [photo, setPhoto] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file' | 'camera'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const buttonHover = useHoverTap({ hoverScale: 1.02, tapScale: 0.98 });

  // Entry animation
  const entryOpacity = useSharedValue(0);
  const entryY = useSharedValue(20);
  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryY.value }],
  })) as import('@/effects/reanimated/animated-view').AnimatedStyle;

  // Glow animation
  const glowOpacity = useSharedValue(0.5);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  })) as import('@/effects/reanimated/animated-view').AnimatedStyle;

  // Rotate animation
  const rotateValue = useSharedValue(0);
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  })) as import('@/effects/reanimated/animated-view').AnimatedStyle;

  useEffect(() => {
    entryOpacity.value = withTiming(1, { duration: 300 });
    entryY.value = withSpring(0, { damping: 25, stiffness: 300 });

    glowOpacity.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);

    rotateValue.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
  }, [entryOpacity, entryY, glowOpacity, rotateValue]);

  // Animation hooks for conditional rendering
  const photoPresence = useAnimatePresence({
    isVisible: !!photo && !analyzing,
    enterTransition: 'scale',
  });
  const analyzingPresence = useAnimatePresence({
    isVisible: !!analyzing,
    enterTransition: 'slideUp',
  });
  const resultPresence = useAnimatePresence({
    isVisible: showResult && !!result,
    enterTransition: 'scale',
    exitTransition: 'fade',
  });

  const handlePhotoInput = (url: string) => {
    setPhoto(url);
    setResult(null);
    setShowResult(false);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhoto(dataUrl);
      setResult(null);
      setShowResult(false);
      toast.success('Photo uploaded!', {
        description: 'Click Analyze to extract pet information',
      });
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const analyzePhoto = async () => {
    if (!photo) {
      toast.error('Please upload or capture a photo first');
      return;
    }

    setAnalyzing(true);
    setShowResult(false);

    try {
      const isDataUrl = photo.startsWith('data:');
      const prompt = buildLLMPrompt`You are an expert veterinarian and animal behaviorist. Analyze this pet photo and extract the following information. Be specific but realistic.

${isDataUrl ? 'This is an uploaded/captured photo of a pet.' : `Photo URL: ${photo}`}

Based on typical characteristics of pets in photos, provide:
1. The most likely breed (be specific, e.g., "Golden Retriever" not just "Dog")
2. Estimated age in years (1-15)
3. Size category: small (under 20 lbs), medium (20-50 lbs), large (50-100 lbs), or extra-large (over 100 lbs)
4. 3-5 personality traits from this list: Playful, Calm, Energetic, Gentle, Social, Independent, Affectionate, Curious, Protective, Loyal, Friendly, Quiet
5. Your confidence level in this analysis (0-100)

Return ONLY valid JSON with this exact structure, nothing else:
{
  "breed": "breed name",
  "age": number,
  "size": "small" | "medium" | "large" | "extra-large",
  "personality": ["trait1", "trait2", "trait3"],
  "confidence": number
}`;

      const response = await llmService.llm(prompt, 'gpt-4o', true);
      const analysisResult = JSON.parse(response);

      setResult(analysisResult);
      setShowResult(true);

      toast.success('Photo analyzed successfully! 🎉', {
        description: `Found a ${analysisResult.breed} with ${analysisResult.confidence}% confidence`,
      });
    } catch (error) {
      const errorInfo = parseLLMError(error);
      logger.error(
        'Failed to analyze photo',
        error instanceof Error ? error : new Error(String(error)),
        { technicalMessage: errorInfo.technicalMessage }
      );
      toast.error('Failed to analyze photo', {
        description: errorInfo.userMessage,
        duration: 6000,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      onAnalysisComplete({ ...result, photo });
      toast.success('Information applied!', {
        description: 'You can still edit any field before saving',
      });
    }
  };

  return (
    <div className="space-y-4">
      <AnimatedView style={entryStyle} className="relative">
        <Card className="p-6 bg-linear-to-br from-primary/5 via-accent/5 to-secondary/5 border-2 border-dashed border-primary/20">
          <div className="flex items-start gap-4">
            <AnimatedView
              style={glowStyle}
              className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center shrink-0"
            >
              <AnimatedView style={rotateStyle}>
                <Sparkle size={24} weight="fill" className="text-white" />
              </AnimatedView>
            </AnimatedView>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                AI Photo Analysis
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload, capture, or paste a photo URL and let AI automatically detect breed, age,
                size, and personality
              </p>

              <div className="flex gap-2 mb-3">
                <AnimatedView
                  style={buttonHover.animatedStyle}
                  onMouseEnter={buttonHover.handleMouseEnter}
                  onMouseLeave={buttonHover.handleMouseLeave}
                  onClick={buttonHover.handlePress}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadMode === 'camera' ? 'default' : 'outline'}
                    onClick={() => {
                      setUploadMode('camera');
                      handleCameraCapture();
                    }}
                    className="gap-2"
                  >
                    <Camera size={16} weight="fill" />
                    <span>Camera</span>
                  </Button>
                </AnimatedView>
                <AnimatedView
                  style={buttonHover.animatedStyle}
                  onMouseEnter={buttonHover.handleMouseEnter}
                  onMouseLeave={buttonHover.handleMouseLeave}
                  onClick={buttonHover.handlePress}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadMode === 'file' ? 'default' : 'outline'}
                    onClick={() => {
                      setUploadMode('file');
                      handleFileSelect();
                    }}
                    className="gap-2"
                  >
                    <ImageIcon size={16} weight="fill" />
                    <span>Upload</span>
                  </Button>
                </AnimatedView>
                <AnimatedView
                  style={buttonHover.animatedStyle}
                  onMouseEnter={buttonHover.handleMouseEnter}
                  onMouseLeave={buttonHover.handleMouseLeave}
                  onClick={buttonHover.handlePress}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadMode === 'url' ? 'default' : 'outline'}
                    onClick={() => setUploadMode('url')}
                    className="gap-2"
                  >
                    <Upload size={16} weight="fill" />
                    <span>URL</span>
                  </Button>
                </AnimatedView>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />

              {uploadMode === 'url' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => handlePhotoInput(e.target.value)}
                    placeholder="Paste image URL here..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                    disabled={analyzing}
                  />
                  <Button
                    type="button"
                    onClick={analyzePhoto}
                    disabled={!photo || analyzing}
                    className="bg-linear-to-r from-primary to-accent hover:opacity-90"
                  >
                    {analyzing ? (
                      <>
                        <AnimatedView style={rotateStyle}>
                          <Sparkle size={18} weight="fill" />
                        </AnimatedView>
                        <span className="ml-2">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={18} weight="fill" />
                        <span className="ml-2">Analyze</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {(uploadMode === 'file' || uploadMode === 'camera') && photo && (
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-muted text-muted-foreground">
                    Photo {uploadMode === 'camera' ? 'captured' : 'uploaded'} ✓
                  </div>
                  <Button
                    type="button"
                    onClick={analyzePhoto}
                    disabled={analyzing}
                    className="bg-linear-to-r from-primary to-accent hover:opacity-90"
                  >
                    {analyzing ? (
                      <>
                        <AnimatedView style={rotateStyle}>
                          <Sparkle size={18} weight="fill" />
                        </AnimatedView>
                        <span className="ml-2">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkle size={18} weight="fill" />
                        <span className="ml-2">Analyze</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </AnimatedView>

      {photoPresence.shouldRender && photo && !analyzing && (
        <AnimatedView
          style={photoPresence.animatedStyle}
          className="relative h-64 rounded-lg overflow-hidden bg-muted"
        >
          <img src={photo} alt="Pet preview" className="w-full h-full object-cover" />
        </AnimatedView>
      )}

      {analyzingPresence.shouldRender && analyzing && (
        <AnimatedView style={analyzingPresence.animatedStyle}>
          <Card className="p-6 bg-linear-to-br from-background to-muted/30">
            <div className="flex items-center gap-3 mb-4">
              <AnimatedView style={rotateStyle}>
                <Sparkle size={24} weight="fill" className="text-primary" />
              </AnimatedView>
              <div>
                <h4 className="font-semibold">Analyzing photo...</h4>
                <p className="text-sm text-muted-foreground">This may take a few seconds</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                'Detecting breed...',
                'Estimating age...',
                'Analyzing personality...',
                'Calculating confidence...',
              ].map((text) => (
                <div key={text} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {text}
                </div>
              ))}
            </div>
          </Card>
        </AnimatedView>
      )}
      {resultPresence.shouldRender && result && (
        <AnimatedView style={resultPresence.animatedStyle}>
          <Card className="p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Check size={24} weight="bold" className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-1">Analysis Complete!</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Confidence:</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  >
                    {result.confidence}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Breed</div>
                <div className="font-semibold">{result.breed}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Age</div>
                <div className="font-semibold">{result.age} years</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Size</div>
                <div className="font-semibold capitalize">{result.size.replace('-', ' ')}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Traits</div>
                <div className="font-semibold">
                  {result.personality && Array.isArray(result.personality)
                    ? result.personality.length
                    : 0}{' '}
                  detected
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2">Personality Traits</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {result.personality.map((trait) => (
                  <Badge
                    key={trait}
                    className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowResult(false);
                  setResult(null);
                }}
              >
                <X size={18} weight="bold" />
                <span className="ml-2">Discard</span>
              </Button>
              <Button
                className="flex-1 bg-linear-to-r from-green-500 to-emerald-500 hover:opacity-90"
                onClick={handleAccept}
              >
                <Check size={18} weight="bold" />
                <span className="ml-2">Apply to Profile</span>
              </Button>
            </div>
          </Card>
        </AnimatedView>
      )}
    </div>
  );
}
