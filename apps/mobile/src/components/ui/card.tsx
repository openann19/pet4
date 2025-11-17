'use client'

import React, { type ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { ComponentProps } from 'react'

export interface CardProps extends ComponentProps<typeof View> {
  children?: ReactNode
}

export function Card({ children, style, ...props }: CardProps): React.JSX.Element {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  )
}

export interface CardHeaderProps extends ComponentProps<typeof View> {
  children?: ReactNode
}

export function CardHeader({ children, style, ...props }: CardHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.cardHeader, style]} {...props}>
      {children}
    </View>
  )
}

export interface CardTitleProps extends ComponentProps<typeof Text> {
  children?: ReactNode
}

export function CardTitle({ children, style, ...props }: CardTitleProps): React.JSX.Element {
  return (
    <Text style={[styles.cardTitle, style]} {...props}>
      {children}
    </Text>
  )
}

export interface CardDescriptionProps extends ComponentProps<typeof Text> {
  children?: ReactNode
}

export function CardDescription({
  children,
  style,
  ...props
}: CardDescriptionProps): React.JSX.Element {
  return (
    <Text style={[styles.cardDescription, style]} {...props}>
      {children}
    </Text>
  )
}

export interface CardContentProps extends ComponentProps<typeof View> {
  children?: ReactNode
}

export function CardContent({ children, style, ...props }: CardContentProps): React.JSX.Element {
  return (
    <View style={[styles.cardContent, style]} {...props}>
      {children}
    </View>
  )
}

export interface CardFooterProps extends ComponentProps<typeof View> {
  children?: ReactNode
}

export function CardFooter({ children, style, ...props }: CardFooterProps): React.JSX.Element {
  return (
    <View style={[styles.cardFooter, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'var(--color-bg-overlay)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: 'var(--color-fg)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    padding: 0,
    gap: 24,
  },
  cardHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 0,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'var(--color-fg)',
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingVertical: 0,
  },
  cardFooter: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
