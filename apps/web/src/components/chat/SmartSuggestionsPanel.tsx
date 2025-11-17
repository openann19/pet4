import { useState, useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring } from '@petspark/motion';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { Sparkle, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { usePressBounce } from '@/effects/reanimated/use-bounce-on-tap';
import type { SmartSuggestion } from '@/lib/chat-types';
import { useUIConfig } from "@/hooks/use-ui-config";

interface SmartSuggestionsPanelProps {
  onSelect: (suggestion: SmartSuggestion) => void;
  onDismiss: () => void;
}

export default function SmartSuggestionsPanel({ onSelect, onDismiss }: SmartSuggestionsPanelProps) {
  const _uiConfig = useUIConfig();
  const [suggestions] = useState<SmartSuggestion[]>([
    { id: '1', category: 'suggestion', text: 'Tell me more about your pet!', icon: '🐾' },
    { id: '2', category: 'suggestion', text: 'Want to set up a playdate?', icon: '🎾' },
    { id: '3', category: 'question', text: 'What does your pet love to do?', icon: '❓' },
  ]);

  const y = useSharedValue<number>(20);
  const opacity = useSharedValue<number>(0);

  useEffect(() => {
    y.value = withSpring(0, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [y, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  })) as AnimatedStyle;

  const containerStyleValue = useAnimatedStyleValue(containerStyle);

  return (
    <div style={containerStyleValue} className="px-4 pb-2">
      <div className="glass-effect rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkle size={16} weight="fill" className="text-primary" />
            <span className="text-xs font-semibold">Smart Suggestions</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0"
            onClick={onDismiss}
            aria-label="Dismiss smart suggestions"
          >
            <X size={12} />
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((suggestion) => (
            <SuggestionButton key={suggestion.id} suggestion={suggestion} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestionButton({
  suggestion,
  onSelect,
}: {
  suggestion: SmartSuggestion;
  onSelect: (suggestion: SmartSuggestion) => void;
}) {
  const hoverLift = useHoverLift({ scale: 1.02 });
  const bounceOnTap = usePressBounce({ scale: 0.98 });

  const buttonStyle = useAnimatedStyle(() => {
    const hoverScale = hoverLift.scale.get();
    const bounceScale = bounceOnTap.scale.get();
    return {
      transform: [{ scale: hoverScale * bounceScale }],
    };
  }) as AnimatedStyle;

  const buttonStyleValue = useAnimatedStyleValue(buttonStyle);

  return (
    <button
      onClick={() => { onSelect(suggestion); }}
      onMouseEnter={hoverLift.handleEnter}
      onMouseLeave={hoverLift.handleLeave}
      onMouseDown={bounceOnTap.handlePress}
      style={buttonStyleValue}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap text-sm"
    >
      {suggestion.icon && <span>{suggestion.icon}</span>}
      <span>{suggestion.text}</span>
    </button>
  );
}
