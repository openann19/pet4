'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  MotionView,
  type AnimatedStyle,
} from '@petspark/motion';
import { isTruthy } from '@petspark/shared';
import { MagnifyingGlass, X, Crown, Clock } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useStorage } from '@/hooks/use-storage';
import { useBounceOnTap } from '@/effects/reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import {
  STICKER_CATEGORIES,
  STICKER_LIBRARY,
  getStickersByCategory,
  searchStickers,
  getPremiumStickers,
  getRecentStickers,
  type Sticker,
} from '@/lib/sticker-library';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

import { useUIConfig } from "@/hooks/use-ui-config";

interface StickerPickerProps {
  onSelectSticker: (sticker: Sticker) => void;
  onClose: () => void;
}

export function StickerPicker({ onSelectSticker, onClose }: StickerPickerProps) {
  const _uiConfig = useUIConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentStickerIds, setRecentStickerIds] = useStorage<string[]>('recent-stickers', []);
  const [hoveredSticker, setHoveredSticker] = useState<string | null>(null);

  const containerOpacity = useSharedValue(0);
  const containerY = useSharedValue(20);
  const contentOpacity = useSharedValue(0);

  const displayedStickers = useMemo(() => {
    if (searchQuery.trim()) {
      return searchStickers(searchQuery);
    }

    if (selectedCategory === 'all') {
      return STICKER_LIBRARY;
    }

    if (selectedCategory === 'recent') {
      return getRecentStickers(recentStickerIds ?? []);
    }

    if (selectedCategory === 'premium') {
      return getPremiumStickers();
    }

    return getStickersByCategory(selectedCategory);
  }, [searchQuery, selectedCategory, recentStickerIds]);

  const handleStickerClick = (sticker: Sticker) => {
    haptics.impact('medium');

    const updatedRecent = [
      sticker.id,
      ...(recentStickerIds ?? []).filter((id) => id !== sticker.id),
    ].slice(0, 24);
    void setRecentStickerIds(updatedRecent);

    onSelectSticker(sticker);
  };

  const handleCategoryChange = useCallback((categoryId: string) => {
    haptics.impact('light');
    setSelectedCategory(categoryId);
    setSearchQuery('');
  }, []);

  const recentCount = recentStickerIds?.length ?? 0;

  useEffect(() => {
    containerOpacity.value = withTiming(1, timingConfigs.smooth);
    containerY.value = withSpring(0, springConfigs.smooth);
    contentOpacity.value = withDelay(100, withTiming(1, timingConfigs.smooth));
  }, [containerOpacity, containerY, contentOpacity]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ translateY: containerY.value }],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  const handleClose = useCallback(() => {
    haptics.impact('light');
    containerOpacity.value = withTiming(0, timingConfigs.fast);
    containerY.value = withTiming(20, timingConfigs.fast);
    setTimeout(() => {
      onClose();
    }, 150);
  }, [containerOpacity, containerY, onClose]);

  return (
    <MotionView
      style={containerStyle}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] bg-card/95 backdrop-blur-2xl border-t border-border/40 shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-105 sm:rounded-2xl sm:border sm:max-h-150"
    >
      <div className="flex flex-col h-full max-h-[70vh] sm:max-h-150">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Stickers</h3>
            {displayedStickers.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {displayedStickers.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void handleClose()}
            className="rounded-full"
            aria-label="Close sticker picker"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="px-4 pt-4">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {!searchQuery && (
          <div className="px-4 py-3 border-b border-border/40">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { handleCategoryChange('all'); }}
                  className="whitespace-nowrap rounded-full"
                >
                  All
                </Button>
                {recentCount > 0 && (
                  <Button
                    variant={selectedCategory === 'recent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { handleCategoryChange('recent'); }}
                    className="whitespace-nowrap rounded-full gap-1.5"
                  >
                    <Clock size={14} weight="bold" />
                    Recent
                  </Button>
                )}
                <Button
                  variant={selectedCategory === 'premium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { handleCategoryChange('premium'); }}
                  className="whitespace-nowrap rounded-full gap-1.5"
                >
                  <Crown size={14} weight="fill" />
                  Premium
                </Button>
                {STICKER_CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { handleCategoryChange(category.id); }}
                    className="whitespace-nowrap rounded-full gap-1.5"
                  >
                    <span>{category.emoji}</span>
                    <span className="hidden sm:inline">{category.name}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScrollArea className="flex-1 px-4">
          <MotionView style={contentStyle}>
            {displayedStickers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4 opacity-50">🔍</div>
                <p className="text-muted-foreground">
                  {searchQuery ? 'No stickers found' : 'No stickers in this category'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 py-4">
                {displayedStickers.map((sticker, index) => (
                  <StickerButton
                    key={sticker.id}
                    sticker={sticker}
                    index={index}
                    isHovered={hoveredSticker === sticker.id}
                    onHover={() => { setHoveredSticker(sticker.id); }}
                    onLeave={() => { setHoveredSticker(null); }}
                    onClick={() => { handleStickerClick(sticker); }}
                  />
                ))}
              </div>
            )}
          </MotionView>
        </ScrollArea>
      </div>
    </MotionView>
  );
}

interface StickerButtonProps {
  sticker: Sticker;
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function StickerButton({
  sticker,
  index,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: StickerButtonProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const hoverScale = useSharedValue(1);

  const bounceAnimation = useBounceOnTap({
    onPress: onClick,
    scale: 0.9,
    hapticFeedback: false,
  });

  useEffect(() => {
    const delay = index * 10;
    opacity.value = withDelay(delay, withTiming(1, timingConfigs.smooth));
    scale.value = withDelay(delay, withSpring(1, springConfigs.smooth));
  }, [index, opacity, scale]);

  useEffect(() => {
    if (isTruthy(isHovered)) {
      hoverScale.value = withSpring(1.2, springConfigs.bouncy);
    } else {
      hoverScale.value = withSpring(1, springConfigs.smooth);
    }
  }, [isHovered, hoverScale]);

  const buttonStyle = useAnimatedStyle(() => {
    const combinedScale = scale.value * hoverScale.value;
    return {
      opacity: opacity.value,
      transform: [{ scale: combinedScale }],
    };
  });

  return (
    <MotionView
      style={buttonStyle}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={bounceAnimation.handlePress}
      className={cn(
        'relative aspect-square rounded-xl flex items-center justify-center text-4xl hover:bg-muted/50 cursor-pointer',
        isHovered && 'bg-muted/50'
      )}
      title={sticker.label}
    >
      <span className="select-none">{sticker.emoji}</span>
      {sticker.premium && (
        <Crown size={12} weight="fill" className="absolute top-0.5 right-0.5 text-accent" />
      )}
    </MotionView>
  );
}
