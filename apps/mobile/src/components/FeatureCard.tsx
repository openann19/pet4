import { colors } from '@mobile/theme/colors'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

type FeatureCardProps = {
  title: string
  subtitle?: string
  children?: ReactNode
  accessible?: boolean
  accessibilityLabel?: string
  accessibilityRole?: 'summary' | 'text' | 'none'
  accessibilityHint?: string
}

export function FeatureCard({
  title,
  subtitle,
  children,
  accessible = true,
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
}: FeatureCardProps): React.JSX.Element {
  const label = accessibilityLabel || (subtitle ? `${title}. ${subtitle}` : title)

  return (
    <View
      style={styles.container}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <Text style={styles.title} accessible accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} accessible accessibilityRole="text">
          {subtitle}
        </Text>
      ) : null}
      {children ? (
        <View style={styles.content} accessible={false}>
          {children}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    marginTop: 12,
    gap: 12,
  },
})
