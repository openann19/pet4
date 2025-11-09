'use client';

import { useState, useCallback, useRef, useEffect, useId } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Eye, EyeSlash, X, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

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
  const uiConfig = useUIConfig();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id || generatedId;
  const labelId = `${inputId}-label`;
  const helperTextId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const ariaDescribedBy = [helperTextId, errorId].filter(Boolean).join(' ') || undefined;

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
      labelScale.value = withSpring(0.85, springConfigs.smooth);
      labelY.value = withSpring(-24, springConfigs.smooth);
    } else {
      labelScale.value = withSpring(1, springConfigs.smooth);
      labelY.value = withSpring(0, springConfigs.smooth);
    }
  }, [value, isFocused, labelScale, labelY]);

  useEffect(() => {
    if (isFocused) {
      borderWidth.value = withSpring(2, springConfigs.smooth);
      borderColor.value = withTiming(error ? 1 : 0.5, timingConfigs.fast);
      iconScale.value = withSpring(1.1, springConfigs.smooth);
    } else {
      borderWidth.value = withSpring(variant === 'outlined' ? 1 : 0, springConfigs.smooth);
      borderColor.value = withTiming(error ? 1 : 0, timingConfigs.fast);
      iconScale.value = withSpring(1, springConfigs.smooth);
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
    transform: [{ scale: labelScale.value }, { translateY: labelY.value }],
  })) as AnimatedStyle;

  const borderStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    borderColor:
      borderColor.value === 1
        ? error
          ? 'rgb(239, 68, 68)'
          : 'rgb(99, 102, 241)'
        : 'rgba(0, 0, 0, 0.1)',
  })) as AnimatedStyle;

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  })) as AnimatedStyle;

  const inputType =
    showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;

  const sizes = {
    sm: 'px-3 py-2 text-sm h-10',
    md: 'px-4 py-2.5 text-base h-12',
    lg: 'px-5 py-3 text-lg h-14',
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
          'focus-within:ring-2 focus-within:ring-primary/20',
          error && 'ring-2 ring-red-500/20',
          disabled && 'opacity-50 cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        onMouseEnter={hoverLift.handleEnter}
        onMouseLeave={hoverLift.handleLeave}
      >
        <AnimatedView
          style={borderStyle}
          className="absolute inset-0 rounded-xl pointer-events-none"
        />

        {leftIcon && (
          <AnimatedView style={iconStyle} className="shrink-0 mr-2 text-muted-foreground">
            {leftIcon}
          </AnimatedView>
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
          <AnimatedView
            style={labelStyle}
            className={cn(
              'absolute left-4 pointer-events-none transition-colors',
              'text-muted-foreground font-medium',
              isFocused && 'text-primary',
              error && 'text-red-500',
              size === 'sm' && 'text-sm',
              size === 'lg' && 'text-base'
            )}
            aria-hidden="true"
          >
            {label}
          </AnimatedView>
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
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50',
            label && 'pt-6',
            !leftIcon && !label && 'pt-0'
          )}
          {...(label ? {} : !props['aria-label'] ? { 'aria-label': props.placeholder || 'Input' } : {})}
          {...props}
        />

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {showClearButton && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Clear input"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          )}

          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={togglePassword}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlash size={16} className="text-muted-foreground" />
              ) : (
                <Eye size={16} className="text-muted-foreground" />
              )}
            </button>
          )}

          {error && <WarningCircle size={16} className="text-red-500 shrink-0" />}

          {!error && hasValue && !showClearButton && (
            <CheckCircle size={16} className="text-green-500 shrink-0" />
          )}

          {rightIcon && <div className="shrink-0 text-muted-foreground">{rightIcon}</div>}
        </div>
      </div>

      {(error || helperText) && (
        <div
          id={error ? errorId : helperTextId}
          className={cn(
            'mt-1.5 text-xs flex items-center gap-1',
            error ? 'text-red-500' : 'text-muted-foreground'
          )}
          role={error ? 'alert' : undefined}
        >
          {error ? <WarningCircle size={12} /> : null}
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  );
}
