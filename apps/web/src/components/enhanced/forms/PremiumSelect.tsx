'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, ChevronDown, X } from 'lucide-react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface PremiumSelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface PremiumSelectProps {
  options: PremiumSelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiSelect?: boolean;
  label?: string;
  placeholder?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
}

export function PremiumSelect({
  options,
  value,
  onChange,
  multiSelect = false,
  label,
  placeholder = 'Select...',
  variant = 'default',
  size = 'md',
  searchable = false,
  error,
  helperText,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: PremiumSelectProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      scale.value = withSpring(1, springConfigs.smooth);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(0.95, springConfigs.smooth);
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [isOpen, scale, opacity]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  })) as AnimatedStyle;

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (multiSelect) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
        haptics.selection();
      } else {
        onChange?.(optionValue);
        setIsOpen(false);
        haptics.selection();
      }
    },
    [multiSelect, selectedValues, onChange]
  );

  const handleRemove = useCallback(
    (optionValue: string) => {
      const newValues = selectedValues.filter((v) => v !== optionValue);
      onChange?.(newValues);
      haptics.selection();
    },
    [selectedValues, onChange]
  );

  const variants = {
    default: 'bg-background border-input',
    filled: 'bg-muted/50 border-transparent',
    outlined: 'bg-transparent border-2 border-input',
    glass: 'glass-card border-border/50',
  };

  const sizes = {
    sm: 'h-9 text-sm px-3',
    md: 'h-12 text-base px-4',
    lg: 'h-14 text-lg px-5',
  };

  const displayValue = multiSelect
    ? selectedValues.length > 0
      ? `${selectedValues.length} selected`
      : placeholder
    : options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className={cn('relative w-full', className)}>
      {label && <label className="block text-sm font-medium mb-2 text-foreground">{label}</label>}

      <Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value={Array.isArray(value) ? value[0] : value}
      >
        <SelectTrigger
          className={cn(
            'w-full rounded-xl transition-all duration-300',
            'focus-visible:ring-2 focus-visible:ring-primary/20',
            error && 'border-destructive focus-visible:ring-destructive/20',
            variants[variant],
            sizes[size],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={ariaLabel}
          disabled={disabled}
        >
          <SelectValue placeholder={placeholder}>
            {multiSelect && selectedValues.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedValues.slice(0, 2).map((val) => {
                  const option = options.find((opt) => opt.value === val);
                  return (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-sm"
                    >
                      {option?.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(val);
                        }}
                        className="hover:bg-primary/20 rounded p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                {selectedValues.length > 2 && (
                  <span className="text-sm text-muted-foreground">
                    +{selectedValues.length - 2} more
                  </span>
                )}
              </div>
            ) : (
              displayValue
            )}
          </SelectValue>
          <ChevronDown
            className={cn(
              'ml-2 h-4 w-4 opacity-50 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </SelectTrigger>

        <SelectContent className="w-full min-w-[200px]">
          <AnimatedView style={contentStyle}>
            {searchable && (
              <div className="p-2 border-b">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      onSelect={() => handleSelect(option.value)}
                      className={cn('cursor-pointer', isSelected && 'bg-accent')}
                    >
                      <div className="flex items-center gap-2">
                        {option.icon && <span>{option.icon}</span>}
                        <span>{option.label}</span>
                        {isSelected && multiSelect && <Check className="ml-auto h-4 w-4" />}
                      </div>
                    </SelectItem>
                  );
                })
              )}
            </div>
          </AnimatedView>
        </SelectContent>
      </Select>

      {(error || helperText) && (
        <div className={cn('mt-1.5 text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}
