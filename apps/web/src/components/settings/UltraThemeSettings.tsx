/**
 * Ultra Theme Settings Panel
 * Comprehensive theme customization with live preview and animations
 */

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { themePresets, type ThemePreset } from '@/lib/theme-presets';
import { Button } from '@/components/ui/button';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import {
  useUltraCardReveal,
  useMagneticHover,
  useElasticScale,
  useGlowBorder,
  useBreathingAnimation,
} from '@/effects/reanimated';
import { Moon, Sun, Palette, Check } from '@phosphor-icons/react';

export function UltraThemeSettings() {
  const { themePreset, setThemePreset } = useApp();
  const [previewTheme, setPreviewTheme] = useState<ThemePreset | null>(null);

  const currentTheme = previewTheme || themePreset;
  const currentPreset = themePresets.find((p) => p.id === currentTheme);

  // Group themes by mode
  const lightThemes = themePresets.filter((p) => p.mode === 'light');
  const darkThemes = themePresets.filter((p) => p.mode === 'dark');

  const handleSelectTheme = (preset: ThemePreset) => {
    setThemePreset(preset);
    setPreviewTheme(null);
  };

  const handlePreviewTheme = (preset: ThemePreset) => {
    setPreviewTheme(preset);
  };

  const handleCancelPreview = () => {
    setPreviewTheme(null);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Palette size={32} className="text-primary" weight="duotone" />
          <h2 className="text-3xl font-bold">Ultra Theme Settings</h2>
        </div>
        <p className="text-muted-foreground text-lg">
          Choose from our collection of meticulously crafted themes with live preview
        </p>
      </div>

      {/* Current Theme Preview */}
      {currentPreset && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                {currentPreset.mode === 'dark' ? (
                  <Moon size={24} weight="fill" />
                ) : (
                  <Sun size={24} weight="fill" />
                )}
                {currentPreset.name}
              </h3>
              <p className="text-muted-foreground">{currentPreset.description}</p>
            </div>
            {previewTheme && (
              <div className="flex gap-2">
                <Button
                  onClick={() => { handleSelectTheme(previewTheme); }}
                  className="gap-2"
                >
                  <Check size={20} weight="bold" />
                  Apply Theme
                </Button>
                <Button onClick={handleCancelPreview} variant="outline">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Color Preview */}
          <div className="flex gap-4 flex-wrap">
            <div
              className="w-24 h-24 rounded-xl shadow-lg border-2 border-white/20"
              style={{ backgroundColor: currentPreset.preview.primary }}
            />
            <div
              className="w-24 h-24 rounded-xl shadow-lg border-2 border-white/20"
              style={{ backgroundColor: currentPreset.preview.secondary }}
            />
            <div
              className="w-24 h-24 rounded-xl shadow-lg border-2 border-white/20"
              style={{ backgroundColor: currentPreset.preview.accent }}
            />
          </div>
        </div>
      )}

      {/* Light Themes */}
      <ThemeSection
        title="Light Themes"
        icon={<Sun size={24} weight="duotone" />}
        themes={lightThemes}
        currentTheme={currentTheme}
        onPreview={handlePreviewTheme}
        onSelect={handleSelectTheme}
      />

      {/* Dark Themes */}
      <ThemeSection
        title="Dark Themes"
        icon={<Moon size={24} weight="duotone" />}
        themes={darkThemes}
        currentTheme={currentTheme}
        onPreview={handlePreviewTheme}
        onSelect={handleSelectTheme}
      />
    </div>
  );
}

interface ThemeSectionProps {
  title: string;
  icon: React.ReactNode;
  themes: typeof themePresets;
  currentTheme: ThemePreset;
  onPreview: (theme: ThemePreset) => void;
  onSelect: (theme: ThemePreset) => void;
}

function ThemeSection({
  title,
  icon,
  themes,
  currentTheme,
  onPreview,
  onSelect,
}: ThemeSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold flex items-center gap-2">
        {icon}
        {title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((preset, index) => (
          <ThemeCard
            key={preset.id}
            preset={preset}
            index={index}
            isActive={preset.id === currentTheme}
            onPreview={onPreview}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface ThemeCardProps {
  preset: typeof themePresets[0];
  index: number;
  isActive: boolean;
  onPreview: (theme: ThemePreset) => void;
  onSelect: (theme: ThemePreset) => void;
}

function ThemeCard({ preset, index, isActive, onPreview, onSelect }: ThemeCardProps) {
  const cardReveal = useUltraCardReveal({ index, enabled: true });
  const magnetic = useMagneticHover({ strength: 0.2, enabled: !isActive });
  const elastic = useElasticScale({ scaleDown: 0.98, scaleUp: 1.02 });
  const glow = useGlowBorder({
    enabled: isActive,
    color: preset.preview.primary,
    intensity: 16,
    speed: 2500,
  });
  const breathing = useBreathingAnimation({ enabled: isActive, duration: 3500 });

  const combinedStyle = {
    ...cardReveal.animatedStyle,
    ...(isActive ? breathing.animatedStyle : {}),
  };

  return (
    <div
      ref={magnetic.handleRef}
      onMouseEnter={magnetic.handleMouseEnter}
      onMouseLeave={magnetic.handleMouseLeave}
      onMouseMove={magnetic.handleMouseMove}
      className="relative"
    >
      <AnimatedView style={combinedStyle}>
        <div
          onMouseDown={elastic.handlePressIn}
          onMouseUp={elastic.handlePressOut}
          onMouseLeave={elastic.handlePressOut}
        >
          <AnimatedView style={elastic.animatedStyle}>
            <div
              onMouseEnter={() => { onPreview(preset.id); }}
              onClick={() => { onSelect(preset.id); }}
              className={`
                relative bg-card border-2 rounded-2xl p-6 cursor-pointer
                transition-all duration-300 hover:shadow-2xl
                ${
                  String(isActive
                                      ? 'border-primary shadow-lg'
                                      : 'border-border hover:border-primary/50' ?? '')
                }
              `}
            >
              {isActive && (
                <AnimatedView style={glow.animatedStyle}>
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" />
                </AnimatedView>
              )}

              {isActive && (
                <div className="absolute top-4 right-4">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Check size={20} weight="bold" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold flex items-center gap-2">
                    {preset.mode === 'dark' ? (
                      <Moon size={20} weight="fill" />
                    ) : (
                      <Sun size={20} weight="fill" />
                    )}
                    {preset.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {preset.description}
                  </p>
                </div>

                {/* Color Swatches */}
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-12 rounded-lg shadow-md border border-white/10"
                    style={{ backgroundColor: preset.preview.primary }}
                  />
                  <div
                    className="flex-1 h-12 rounded-lg shadow-md border border-white/10"
                    style={{ backgroundColor: preset.preview.secondary }}
                  />
                  <div
                    className="flex-1 h-12 rounded-lg shadow-md border border-white/10"
                    style={{ backgroundColor: preset.preview.accent }}
                  />
                </div>

                {/* Preview Elements */}
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <div
                      className="h-8 flex-1 rounded-md"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <div
                      className="h-8 w-8 rounded-md"
                      style={{ backgroundColor: preset.colors.secondary }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="h-4 flex-1 rounded"
                      style={{ backgroundColor: preset.colors.muted }}
                    />
                    <div
                      className="h-4 flex-1 rounded"
                      style={{ backgroundColor: preset.colors.accent }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedView>
        </div>
      </AnimatedView>
    </div>
  );
}
