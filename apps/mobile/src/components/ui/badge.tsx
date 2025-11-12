'use client'

import React from 'react'
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native'
import type { ComponentProps } from 'react'

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface BadgeVariantProps {
  variant?: BadgeVariant
}

export interface BadgeProps extends ComponentProps<typeof View> {
  variant?: BadgeVariant
  children?: React.ReactNode
}

const badgeVariants: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  default: {
    container: {
      backgroundColor: 'var(--color-accent-secondary-9)',
      borderColor: 'transparent',
    },
    text: {
      color: 'var(--color-bg-overlay)',
    },
  },
  secondary: {
    container: {
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      borderColor: 'transparent',
    },
    text: {
      color: '#6b7280',
    },
  },
  destructive: {
    container: {
      backgroundColor: 'var(--color-error-9)',
      borderColor: 'transparent',
    },
    text: {
      color: 'var(--color-bg-overlay)',
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderColor: 'rgba(0, 0, 0, 0.2)',
    },
    text: {
      color: 'var(--color-fg)',
    },
  },
}

export function Badge({
  variant = 'default',
  children,
  style,
  ...props
}: BadgeProps): React.JSX.Element {
  const variantStyles = badgeVariants[variant]

  return (
    <View style={[styles.container, variantStyles.container, style]} {...props}>
      <Text style={[styles.text, variantStyles.text]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
})
