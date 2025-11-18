import { useState, useEffect } from 'react';
import {
  useSharedValue,
  use
  withRepeat,
  withTiming,
  withSequence,
  MotionView,
} from '@petspark/motion';
import type  from '@petspark/motion';
import { useAnimatePresence } from '@/effects/reanimated';
import { Sparkle, Eye, ArrowRight } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';

const DEMO_PETS = [
  {
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    breed: 'Golden Retriever',
    age: 3,
    size: 'large',
    personality: ['Friendly', 'Playful', 'Energetic', 'Social'],
    confidence: 92,
  },
  {
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    breed: 'Tabby Cat',
    age: 2,
    size: 'small',
    personality: ['Curious', 'Independent', 'Calm', 'Affectionate'],
    confidence: 88,
  },
  {
    photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    breed: 'German Shepherd',
    age: 4,
    size: 'large',
    personality: ['Loyal', 'Protective', 'Energetic', 'Social'],
    confidence: 95,
  },
];

export default function VisualAnalysisDemo(): JSX.Element | null {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Animated values
  const iconRotate = useSharedValue(0);
  const iconBoxShadow = useSharedValue(0);
  const photoOpacity = useSharedValue(0);
  const photoScale = useSharedValue(0.95);
  const sparkleRotate = useSharedValue(0);
  const dotScale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
    boxShadow: `0 0 ${20 + iconBoxShadow.value * 10}px rgba(245,158,11,${0.3 + iconBoxShadow.value * 0.2})`,
  })) as AnimatedStyle;

  const photoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
    transform: [{ scale: photoScale.value }],
  })) as AnimatedStyle;

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  })) as AnimatedStyle;

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  })) as AnimatedStyle;

  const promptPresence = useAnimatePresence({
    isVisible: !showResult && !analyzing,
    enterTransition: 'slideUp',
    exitTransition: 'slideDown',
  });

  const analyzingPresence = useAnimatePresence({
    isVisible: analyzing,
    enterTransition: 'slideUp',
    exitTransition: 'slideDown',
  });

  const resultPresence = useAnimatePresence({
    isVisible: showResult,
    enterTransition: 'scale',
    exitTransition: 'fade',
  });

  useEffect(() => {
    iconRotate.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false);
    iconBoxShadow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0, { duration: 1000 })),
      -1,
      true
    );
    photoOpacity.value = withTiming(1, { duration: 300 });
    photoScale.value = withTiming(1, { duration: 300 });
  }, [selectedIndex, iconRotate, iconBoxShadow, photoOpacity, photoScale]);

  useEffect(() => {
    if (analyzing) {
      sparkleRotate.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(1.5, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      sparkleRotate.value = 0;
      dotScale.value = 1;
    }
  }, [analyzing, sparkleRotate, dotScale]);

  const currentPet = DEMO_PETS[selectedIndex];
  if (!currentPet) return null;

  const runDemo = (): void => {
    setShowResult(false);
    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);
      setShowResult(true);
    }, 2000);
  };

  const nextPet = (): void => {
    setSelectedIndex((prev) => (prev + 1) % DEMO_PETS.length);
    setShowResult(false);
    setAnalyzing(false);
  };

  return (
    <Card className="p-6 bg-linear-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="flex items-start gap-4 mb-6">
        <MotionView
          style={iconStyle}
          className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center shrink-0"
        >
          <Eye size={24} weight="fill" className="text-white" />
        </MotionView>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">AI Visual Analysis Demo</h3>
          <p className="text-sm text-muted-foreground">
            See how our AI reads pet photos to extract breed, age, size, and personality traits
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <MotionView
            key={selectedIndex}
            style={photoStyle}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4"
          >
            <ProgressiveImage
              src={currentPet.photo}
              alt="Demo pet"
              className="w-full h-full object-cover"
              aria-label="Demo pet photo"
            />
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                Sample {selectedIndex + 1}/{DEMO_PETS.length}
              </Badge>
            </div>
          </MotionView>

          <div className="flex gap-2">
            <Button
              onClick={() => void runDemo()}
              disabled={analyzing}
              className="flex-1 bg-linear-to-r from-primary to-accent"
            >
              {analyzing ? (
                <>
                  <MotionView style={sparkleStyle}>
                    <Sparkle size={18} weight="fill" />
                  </MotionView>
                  <span className="ml-2">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span className="ml-2">Analyze This Photo</span>
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => void nextPet()} disabled={analyzing}>
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>

        <div>
          {promptPresence.shouldRender && !showResult && !analyzing && (
            <MotionView
              style={promptPresence.animatedStyle}
              className="flex items-center justify-center h-full text-center p-8"
            >
              <div>
                <Eye size={48} className="text-muted-foreground/30 mx-auto mb-4" weight="duotone" />
                <p className="text-muted-foreground">
                  Click "Analyze This Photo" to see AI in action
                </p>
              </div>
            </MotionView>
          )}

          {analyzingPresence.shouldRender && analyzing && (
            <MotionView style={analyzingPresence.animatedStyle} className="space-y-4">
              <Card className="p-4 bg-background/50">
                <div className="flex items-center gap-3 mb-4">
                  <MotionView style={sparkleStyle}>
                    <Sparkle size={24} weight="fill" className="text-primary" />
                  </MotionView>
                  <div>
                    <h4 className="font-semibold">Analyzing photo...</h4>
                    <p className="text-xs text-muted-foreground">Processing visual features</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    'Detecting breed...',
                    'Estimating age...',
                    'Analyzing personality...',
                    'Calculating confidence...',
                  ].map((text, idx) => (
                    <div
                      key={text}
                      className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left duration-300"
                      style={{ animationDelay: `${idx * 400}ms` }}
                    >
                      <MotionView
                        style={dotStyle}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                      {text}
                    </div>
                  ))}
                </div>
              </Card>
            </MotionView>
          )}

          {resultPresence.shouldRender && showResult && (
            <MotionView style={resultPresence.animatedStyle} className="h-full">
              <Card className="p-5 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">Analysis Results</h4>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  >
                    {currentPet.confidence}% confidence
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="animate-in fade-in slide-in-from-left duration-300 delay-100">
                    <div className="text-xs text-muted-foreground mb-1">Breed</div>
                    <div className="font-semibold text-lg">{currentPet.breed}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="animate-in fade-in slide-in-from-left duration-300 delay-150">
                      <div className="text-xs text-muted-foreground mb-1">Age</div>
                      <div className="font-semibold">{currentPet.age} years</div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-left duration-300 delay-200">
                      <div className="text-xs text-muted-foreground mb-1">Size</div>
                      <div className="font-semibold capitalize">
                        {currentPet.size.replace('-', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="animate-in fade-in slide-in-from-bottom duration-300 delay-250">
                    <div className="text-xs text-muted-foreground mb-2">Personality Traits</div>
                    <div className="flex flex-wrap gap-2">
                      {currentPet.personality.map((trait, idx) => (
                        <Badge
                          key={trait}
                          className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 animate-in zoom-in duration-300"
                          style={{ animationDelay: `${250 + idx * 50}ms` }}
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom duration-300 delay-400">
                    <p className="text-xs text-muted-foreground">
                      💡 This information would be automatically filled in when creating a pet
                      profile
                    </p>
                  </div>
                </div>
              </Card>
            </MotionView>
          )}
        </div>
      </div>
    </Card>
  );
}
