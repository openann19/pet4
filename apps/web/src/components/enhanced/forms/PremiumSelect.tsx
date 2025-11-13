'use client';

import React, { useState, useCallback, useEffect, useId } from 'react';
import { motion, useMotionValue, animate, type Variants } from 'framer-motion';
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
import { useUIConfig } from "@/hooks/use-ui-config";
import { isTruthy } from '@petspark/shared';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaFormFieldAttributes, getAriaButtonAttributes, getAriaAlertAttributes } from '@/lib/accessibility';

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
  const _uiConfig = useUIConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const scale = useMotionValue(0.95);
  const opacity = useMotionValue(0);

  useEffect(() => {
    if (isOpen) {
      animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(opacity, 1, {
        duration: 0.2,
        ease: 'easeInOut',
      });
    } else {
      animate(scale, 0.95, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(opacity, 0, {
        duration: 0.15,
        ease: 'easeInOut',
      });
    }
  }, [isOpen, scale, opacity]);

  const contentVariants: Variants = {
    closed: {
      scale: 0.95,
      opacity: 0,
    },
    open: {
      scale: 1,
      opacity: 1,
      transition: {
        scale: {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        },
        opacity: {
          duration: 0.2,
          ease: 'easeInOut',
        },
      },
    },
  };

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (isTruthy(multiSelect)) {
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

  const generatedId = useId();
  const selectId = `${generatedId}-select`;
  const labelId = label ? `${selectId}-label` : undefined;
  const helperTextId = helperText ? `${selectId}-helper` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const ariaDescribedBy = [helperTextId, errorId].filter(Boolean).join(' ') || undefined;

  const sizes = {
    sm: cn(
      'h-9',
      getTypographyClasses('caption'),
      getSpacingClassesFromConfig({ paddingX: 'md' })
    ),
    md: cn(
      'h-12',
      getTypographyClasses('body'),
      getSpacingClassesFromConfig({ paddingX: 'lg' })
    ),
    lg: cn(
      'h-14',
      getTypographyClasses('body'),
      getSpacingClassesFromConfig({ paddingX: 'xl' })
    ),
  };

  const displayValue = multiSelect
    ? selectedValues.length > 0
      ? `${String(selectedValues.length ?? '')} selected`
      : placeholder
    : options.find((opt) => opt.value === value)?.label ?? placeholder;

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <label
          id={labelId}
          htmlFor={selectId}
          className={cn(
            'block text-foreground',
            getTypographyClasses('caption'),
            getSpacingClassesFromConfig({ marginY: 'sm' })
          )}
        >
          {label}
        </label>
      )}

      <Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value={Array.isArray(value) ? value[0] : value}
      >
        <SelectTrigger
          id={selectId}
          className={cn(
            'w-full rounded-xl transition-all duration-300',
            'focus-visible:ring-2 focus-visible:ring-primary/20',
            error && 'border-destructive focus-visible:ring-destructive/20',
            variants[variant],
            sizes[size],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...getAriaFormFieldAttributes({
            label: ariaLabel,
            labelledBy: labelId,
            describedBy: ariaDescribedBy,
            invalid: error ? true : undefined,
            disabled,
          })}
          disabled={disabled}
        >
          <SelectValue placeholder={placeholder}>
            {multiSelect && selectedValues.length > 0 ? (
              <div className={cn(
                'flex items-center flex-wrap',
                getSpacingClassesFromConfig({ gap: 'sm' })
              )}>
                {selectedValues.slice(0, 2).map((val) => {
                  const option = options.find((opt) => opt.value === val);
                  return (
                    <span
                      key={val}
                      className={cn(
                        'inline-flex items-center bg-primary/10 text-primary rounded-md',
                        getTypographyClasses('caption'),
                        getSpacingClassesFromConfig({ gap: 'xs', paddingX: 'sm', paddingY: 'xs' })
                      )}
                    >
                      {option?.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(val);
                        }}
                        className={cn(
                          'hover:bg-primary/20 rounded',
                          getSpacingClassesFromConfig({ padding: 'xs' })
                        )}
                        {...getAriaButtonAttributes({ label: `Remove ${option?.label}` })}
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </span>
                  );
                })}
                {selectedValues.length > 2 && (
                  <span className={cn(
                    'text-muted-foreground',
                    getTypographyClasses('caption')
                  )}>
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
              'h-4 w-4 opacity-50 transition-transform duration-200',
              getSpacingClassesFromConfig({ marginX: 'sm' }),
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </SelectTrigger>

        <SelectContent className="w-full min-w-50">
          <motion.div
            variants={contentVariants}
            animate={isOpen ? 'open' : 'closed'}
            style={{
              scale,
              opacity,
            }}
          >
            {searchable && (
              <div className={cn(
                'border-b',
                getSpacingClassesFromConfig({ padding: 'sm' })
              )}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); }}
                  placeholder="Search..."
                  aria-label="Search options"
                  className={cn(
                    'w-full rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    getTypographyClasses('caption'),
                    getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' })
                  )}
                />
              </div>
            )}

            <div className="max-h-75 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className={cn(
                  'text-center text-muted-foreground',
                  getTypographyClasses('caption'),
                  getSpacingClassesFromConfig({ paddingX: 'sm', paddingY: 'xl' })
                )}>
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
                      <div className={cn(
                        'flex items-center',
                        getSpacingClassesFromConfig({ gap: 'sm' })
                      )}>
                        {option.icon && <span aria-hidden="true">{option.icon}</span>}
                        <span>{option.label}</span>
                        {isSelected && multiSelect && <Check className={cn(
                          'ml-auto h-4 w-4',
                          getSpacingClassesFromConfig({ marginX: 'sm' })
                        )} aria-hidden="true" />}
                      </div>
                    </SelectItem>
                  );
                })
              )}
            </div>
          </motion.div>
        </SelectContent>
      </Select>

      {(error ?? helperText) && (
        <div
          id={error ? errorId : helperTextId}
          className={cn(
            'flex items-center',
            getTypographyClasses('caption'),
            getSpacingClassesFromConfig({ marginY: 'xs', gap: 'xs' }),
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
          {...(error ? getAriaAlertAttributes({ role: 'alert', live: 'polite' }) : {})}
        >
          {error ?? helperText}
        </div>
      )}
    </div>
  );
}
