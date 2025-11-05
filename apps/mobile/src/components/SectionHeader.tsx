import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@mobile/theme/colors'

type SectionHeaderProps = {
  title: string
  description?: string
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  }
})
