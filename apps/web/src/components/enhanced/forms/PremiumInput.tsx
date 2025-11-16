'use client';;
import React, { useState, useCallback, useRef, useEffect, useId } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  animate,
  MotionView,
} from '@petspark/motion';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Eye, EyeSlash, X, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getColorToken } from '@/core/tokens';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaFormFieldAttributes, getAriaButtonAttributes, getAriaAlertAttributes } from '@/lib/accessibility';

export interface PremiumInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
  showClearButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  onClear?: () => void;
}

export function PremiumInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  showClearButton = false,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  className,
  value,
  onChange,
  onClear,
  type,
  disabled,
  id,
  ...props
}: PremiumInputProps) {
  const _uiConfig = useUIConfig();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const labelId = `${inputId}-label`;
  const helperTextId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const ariaDescribedBy = [helperTextId, errorId].filter(Boolean).join(' ') || undefined; // Keep || for empty string check

  const hoverLift = useHoverLift({ scale: 1.01 });
  const labelScale = useSharedValue(hasValue || isFocused ? 0.85 : 1);
  const labelY = useSharedValue(hasValue || isFocused ? -24 : 0);
  const borderWidth = useSharedValue(variant === 'outlined' ? 1 : 0);
  const borderColor = useSharedValue(0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    const hasContent = Boolean(value && String(value).length > 0);
    setHasValue(hasContent);

    if (hasContent || isFocused) {
      const scaleTransition = withSpring(0.85, springConfigs.smooth);
      animate(labelScale, scaleTransition.target, scaleTransition.transition);
      const yTransition = withSpring(-24, springConfigs.smooth);
      animate(labelY, yTransition.target, yTransition.transition);
    } else {
      const scaleTransition = withSpring(1, springConfigs.smooth);
      animate(labelScale, scaleTransition.target, scaleTransition.transition);
      const yTransition = withSpring(0, springConfigs.smooth);
      animate(labelY, yTransition.target, yTransition.transition);
    }
  }, [value, isFocused, labelScale, labelY]);

  useEffect(() => {
    if (isFocused) {
      const widthTransition = withSpring(2, springConfigs.smooth);
      animate(borderWidth, widthTransition.target, widthTransition.transition);
      const colorTransition = withTiming(error ? 1 : 0.5, timingConfigs.fast);
      animate(borderColor, colorTransition.target, colorTransition.transition);
      const iconTransition = withSpring(1.1, springConfigs.smooth);
      animate(iconScale, iconTransition.target, iconTransition.transition);
    } else {
      const widthTransition = withSpring(variant === 'outlined' ? 1 : 0, springConfigs.smooth);
      animate(borderWidth, widthTransition.target, widthTransition.transition);
      const colorTransition = withTiming(error ? 1 : 0, timingConfigs.fast);
      animate(borderColor, colorTransition.target, colorTransition.transition);
      const iconTransition = withSpring(1, springConfigs.smooth);
      animate(iconScale, iconTransition.target, iconTransition.transition);
    }
  }, [isFocused, error, variant, borderWidth, borderColor, iconScale]);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      haptics.impact('light');
      props.onFocus?.(e);
    },
    [props]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    },
    [props]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value));
      onChange?.(e);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
      setHasValue(false);
      haptics.impact('light');
      onChange?.({
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
      onClear?.();
      inputRef.current.focus();
    }
  }, [onChange, onClear]);

  const togglePassword = useCallback(() => {
    setShowPassword(!showPassword);
    haptics.impact('light');
  }, [showPassword]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: labelScale.get() }, { translateY: labelY.get() }],
  }));

  // Use design token colors for animated styles
  // Note: For static styles, CSS variables are used in className
  const themeMode = _uiConfig.theme.mode || 'light';
  const THEME_COLORS = {
    primary: getColorToken('accent', themeMode),
    error: getColorToken('destructive', themeMode),
    borderLight: getColorToken('border', themeMode),
  };

  const borderStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.get(),
    borderColor:
      borderColor.get() === 1
        ? error
          ? THEME_COLORS.error
          : THEME_COLORS.primary
        : THEME_COLORS.borderLight,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.get() }],
  }));

  const inputType =
    showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;

  const sizes = {
    sm: cn(
      getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' }),
      getTypographyClasses('caption'),
      'h-10'
    ),
    md: cn(
      getSpacingClassesFromConfig({ paddingX: 'lg', paddingY: 'md' }),
      getTypographyClasses('body'),
      'h-12'
    ),
    lg: cn(
      getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'md' }),
      getTypographyClasses('body'),
      'h-14'
    ),
  };

  const variants = {
    default: 'bg-background border border-input',
    filled: 'bg-muted/50 border-0',
    outlined: 'bg-transparent border',
  };

  return (
    <div className={cn('relative', fullWidth && 'w-full')}>
      <div
        className={cn(
          'relative flex items-center rounded-xl transition-all',
          'focus-within:ring-2 focus-within:ring-[var(--coral-primary)]/20',
          error && 'ring-2 ring-[var(--error)]/20',
          disabled && 'opacity-50 cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        onMouseEnter={hoverLift.handleEnter}
        onMouseLeave={hoverLift.handleLeave}
      >
        <MotionView
          style={borderStyle}
          className="absolute inset-0 rounded-xl pointer-events-none"
        />

        {leftIcon && (
          <MotionView style={iconStyle} className={cn(
            'shrink-0 text-muted-foreground',
            getSpacingClassesFromConfig({ marginX: 'sm' })
          )} aria-hidden="true">
            {leftIcon}
          </MotionView>
        )}

        {label && (
          <label
            htmlFor={inputId}
            id={labelId}
            className="sr-only"
          >
            {label}
          </label>
        )}

        {label && (
          <MotionView
            style={labelStyle}
            className={cn(
              'absolute left-4 pointer-events-none transition-colors',
              'text-muted-foreground font-medium',
              isFocused && 'text-(--coral-primary)',
              error && 'text-(--error)',
              size === 'sm' && 'text-sm',
              size === 'lg' && 'text-base'
            )}
            aria-hidden="true"
          >
            {label}
          </MotionView>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          {...getAriaFormFieldAttributes({
            labelledBy: label ? labelId : undefined,
            describedBy: ariaDescribedBy,
            invalid: error ? true : undefined,
            label: label ? undefined : (props['aria-label'] ?? props.placeholder ?? 'Input'),
          })}
          className={cn(
            'flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50',
            label && 'pt-6',
            !leftIcon && !label && 'pt-0'
          )}
          {...props}
        />

        <div className={cn(
          'flex items-center shrink-0',
          getSpacingClassesFromConfig({ gap: 'xs', marginX: 'sm' })
        )}>
          {showClearButton && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'rounded-md hover:bg-muted transition-colors',
                getSpacingClassesFromConfig({ padding: 'xs' })
              )}
              {...getAriaButtonAttributes({ label: 'Clear input' })}
            >
              <X size={16} className="text-muted-foreground" aria-hidden="true" />
            </button>
          )}

          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={togglePassword}
              className={cn(
                'rounded-md hover:bg-muted transition-colors',
                getSpacingClassesFromConfig({ padding: 'xs' })
              )}
              {...getAriaButtonAttributes({
                label: showPassword ? 'Hide password' : 'Show password',
              })}
            >
              {showPassword ? (
                <EyeSlash size={16} className="text-muted-foreground" aria-hidden="true" />
              ) : (
                <Eye size={16} className="text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          )}

          {error && <WarningCircle size={16} className="text-(--error) shrink-0" aria-hidden="true" />}

          {!error && hasValue && !showClearButton && (
            <CheckCircle size={16} className="text-(--success) shrink-0" aria-hidden="true" />
          )}

          {rightIcon && <div className="shrink-0 text-muted-foreground" aria-hidden="true">{rightIcon}</div>}
        </div>
      </div>
      {(error ?? helperText) && (
        <div
          id={error ? errorId : helperTextId}
          className={cn(
            'flex items-center',
            getTypographyClasses('caption'),
            getSpacingClassesFromConfig({ marginY: 'xs', gap: 'xs' }),
            error ? 'text-(--error)' : 'text-muted-foreground'
          )}
          {...(error ? getAriaAlertAttributes({ role: 'alert', live: 'polite' }) : {})}
        >
          {error ? <WarningCircle size={12} aria-hidden="true" /> : null}
          <span>{error ?? helperText}</span>
        </div>
      )}
    </div>
  );
}
