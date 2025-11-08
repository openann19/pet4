'use client';

import { useCallback, useEffect } from 'react';
import { X, Funnel, Check, Eraser } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useFilters } from '@/hooks/use-filters';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterCategory {
  id: string;
  label: string;
  type: 'multi-select' | 'single-select' | 'range' | 'toggle';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface AdvancedFilterPanelProps {
  categories: FilterCategory[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  onClose?: () => void;
  showActiveCount?: boolean;
}

export function AdvancedFilterPanel({
  categories,
  values,
  onChange,
  onClose,
  showActiveCount = true,
}: AdvancedFilterPanelProps) {
  const {
    values: localValues,
    activeFiltersCount,
    applyFilters,
    resetFilters,
    handleMultiSelect,
    handleSingleSelect,
    handleRangeChange,
    handleToggle,
  } = useFilters({
    categories,
    initialValues: values,
    onApply: (vals) => {
      onChange(vals);
      onClose?.();
    },
  });

  const handleApply = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <Card className="w-full max-w-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Funnel size={20} weight="bold" className="text-primary" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {showActiveCount && activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        )}
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {categories.map((category) => (
          <div key={category.id} className="space-y-3">
            <Label className="text-sm font-medium">{category.label}</Label>

            {category.type === 'multi-select' && category.options && (
              <div className="flex flex-wrap gap-2">
                {category.options.map((option) => {
                  const isSelected = ((localValues[category.id] as string[]) ?? []).includes(
                    option.id
                  );
                  return (
                    <FilterOptionButton
                      key={option.id}
                      option={option}
                      isSelected={isSelected}
                      onClick={() => handleMultiSelect(category.id, option.id)}
                      showCheck={true}
                    />
                  );
                })}
              </div>
            )}

            {category.type === 'single-select' && category.options && (
              <div className="grid grid-cols-2 gap-2">
                {category.options.map((option) => {
                  const isSelected = localValues[category.id] === option.id;
                  return (
                    <FilterOptionButton
                      key={option.id}
                      option={option}
                      isSelected={isSelected}
                      onClick={() => handleSingleSelect(category.id, option.id)}
                      showCheck={false}
                      className="justify-center py-3 rounded-lg"
                    />
                  );
                })}
              </div>
            )}

            {category.type === 'range' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {category.min} {category.unit}
                  </span>
                  <span className="font-semibold text-primary">
                    {(localValues[category.id] as number | undefined) ?? category.min ?? 0}{' '}
                    {category.unit}
                  </span>
                  <span className="text-muted-foreground">
                    {category.max} {category.unit}
                  </span>
                </div>
                <Slider
                  value={
                    [
                      (localValues[category.id] as number | undefined) ?? category.min ?? 0,
                    ] as number[]
                  }
                  onValueChange={(value) => handleRangeChange(category.id, value)}
                  min={category.min ?? 0}
                  max={category.max ?? 100}
                  step={category.step ?? 1}
                  className="w-full"
                />
              </div>
            )}

            {category.type === 'toggle' && (
              <ToggleSwitch
                label={category.label}
                checked={localValues[category.id] as boolean}
                onChange={() => handleToggle(category.id)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={resetFilters}
          className="flex-1 gap-2"
          disabled={activeFiltersCount === 0}
        >
          <Eraser size={16} />
          Reset
        </Button>
        <Button onClick={handleApply} className="flex-1 gap-2">
          <Check size={16} weight="bold" />
          Apply Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-primary-foreground/20">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    </Card>
  );
}

interface FilterOptionButtonProps {
  option: FilterOption;
  isSelected: boolean;
  onClick: () => void;
  showCheck: boolean;
  className?: string;
}

function FilterOptionButton({
  option,
  isSelected,
  onClick,
  showCheck,
  className,
}: FilterOptionButtonProps) {
  const bounceAnimation = useBounceOnTap({ scale: 0.95, hapticFeedback: false });

  return (
    <AnimatedView style={bounceAnimation.animatedStyle}>
      <button
        onClick={() => {
          bounceAnimation.handlePress();
          onClick();
        }}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200',
          isSelected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background border-border hover:border-primary/50',
          className
        )}
      >
        {option.icon}
        <span className="text-sm font-medium">{option.label}</span>
        {showCheck && isSelected && <Check size={16} weight="bold" />}
      </button>
    </AnimatedView>
  );
}

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  const translateX = useSharedValue(checked ? 20 : 0);

  const toggleAnimation = useBounceOnTap({ scale: 0.95, hapticFeedback: false });

  useEffect(() => {
    translateX.value = withTiming(checked ? 20 : 0, { duration: 200 });
  }, [checked, translateX]);

  const handleClick = useCallback(() => {
    toggleAnimation.handlePress();
    onChange();
  }, [onChange, toggleAnimation]);

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  }) as AnimatedStyle;

  return (
    <AnimatedView style={toggleAnimation.animatedStyle}>
      <button
        onClick={handleClick}
        className="flex items-center justify-between w-full p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-200"
      >
        <span className="text-sm font-medium">{label}</span>
        <div
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            checked ? 'bg-primary' : 'bg-muted'
          )}
        >
          <AnimatedView
            style={thumbStyle}
            className="w-5 h-5 mt-0.5 ml-0.5 rounded-full bg-white shadow-md"
          />
        </div>
      </button>
    </AnimatedView>
  );
}
