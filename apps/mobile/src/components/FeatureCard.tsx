import { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@mobile/theme/colors'

type FeatureCardProps = {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function FeatureCard({ title, subtitle, children }: FeatureCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary
  },
  content: {
    marginTop: 12,
    gap: 12
  }
})
