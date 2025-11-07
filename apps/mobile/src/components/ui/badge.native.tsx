'use client'

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
      backgroundColor: '#3b82f6',
      borderColor: 'transparent',
    },
    text: {
      color: '#ffffff',
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
      backgroundColor: '#ef4444',
      borderColor: 'transparent',
    },
    text: {
      color: '#ffffff',
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderColor: 'rgba(0, 0, 0, 0.2)',
    },
    text: {
      color: '#000000',
    },
  },
}

export function Badge({ variant = 'default', children, style, ...props }: BadgeProps) {
  const variantStyles = badgeVariants[variant]

  return (
    <View
      style={[styles.container, variantStyles.container, style]}
      {...props}
    >
      <Text style={[styles.text, variantStyles.text]}>
        {children}
      </Text>
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

