import { Check } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/Label';
import { themePresets, type ThemePreset } from '@/lib/theme-presets';
import { haptics } from '@/lib/haptics';

interface ThemePresetSelectorProps {
  currentPreset?: ThemePreset;
  onPresetChange: (preset: ThemePreset) => void;
}

export default function ThemePresetSelector({
  currentPreset = 'default-light',
  onPresetChange,
}: ThemePresetSelectorProps) {
  const handleSelectPreset = (preset: ThemePreset) => {
    haptics.trigger('selection');
    onPresetChange(preset);
  };

  const lightPresets = themePresets.filter((p) => p.mode === 'light');
  const darkPresets = themePresets.filter((p) => p.mode === 'dark');

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">Theme Presets</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Choose a color theme that matches your style
      </p>

      <div className="space-y-6">
        <div>
          <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
            LIGHT THEMES
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {lightPresets.map((preset) => {
              const isSelected = currentPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'border-primary shadow-lg scale-105'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/3] flex flex-col p-3">
                    <div className="flex gap-1 mb-2">
                      <div
                        className="w-full h-8 rounded-lg shadow-sm"
                        style={{ backgroundColor: preset.preview.primary }}
                      />
                    </div>
                    <div className="flex gap-1 flex-1">
                      <div
                        className="w-1/2 rounded-lg shadow-sm"
                        style={{ backgroundColor: preset.preview.secondary }}
                      />
                      <div
                        className="w-1/2 rounded-lg shadow-sm"
                        style={{ backgroundColor: preset.preview.accent }}
                      />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                      <Check size={16} weight="bold" className="text-primary-foreground" />
                    </div>
                  )}

                  <div className="bg-card/90 backdrop-blur-sm p-2 border-t border-border">
                    <p className="text-xs font-semibold truncate">{preset.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
            DARK THEMES
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {darkPresets.map((preset) => {
              const isSelected = currentPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'border-primary shadow-lg scale-105'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/3] flex flex-col p-3 bg-linear-to-br from-gray-900 to-gray-950">
                    <div className="flex gap-1 mb-2">
                      <div
                        className="w-full h-8 rounded-lg shadow-sm"
                        style={{ backgroundColor: preset.preview.primary }}
                      />
                    </div>
                    <div className="flex gap-1 flex-1">
                      <div
                        className="w-1/2 rounded-lg shadow-sm"
                        style={{ backgroundColor: preset.preview.secondary }}
                      />
                      <div
                        className="w-1/2 rounded-lg shadow-sm"
                        style={{ backgroundColor: preset.preview.accent }}
                      />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                      <Check size={16} weight="bold" className="text-primary-foreground" />
                    </div>
                  )}

                  <div className="bg-card/90 backdrop-blur-sm p-2 border-t border-border">
                    <p className="text-xs font-semibold truncate">{preset.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
