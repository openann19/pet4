/**
 * Age Verification Component (Mobile)
 * 
 * Screen for verifying user age before app access
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { createLogger } from '../utils/logger'
import { setAgeVerified, verifyMinimumAge } from '../utils/age-verification'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { PremiumInput } from './enhanced/forms/PremiumInput'
import { PremiumButton } from './enhanced/PremiumButton'

const logger = createLogger('AgeVerification')

interface AgeVerificationProps {
  onVerified: (verified: boolean) => void
  requiredAge?: number
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerified, requiredAge = 13 }) => {
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerification = async (): Promise<void> => {
    if (!dateOfBirth.trim()) {
      Alert.alert('Required', 'Please enter your date of birth')
      return
    }

    // Basic date validation (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateOfBirth)) {
      Alert.alert('Invalid Format', 'Please enter date in YYYY-MM-DD format')
      return
    }

    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid date')
      return
    }

    setIsLoading(true)

    try {
      const meetsRequirement = verifyMinimumAge(dateOfBirth)

      if (!meetsRequirement) {
        Alert.alert(
          'Age Requirement',
          `You must be at least ${requiredAge} years old to use this app.`,
          [{ text: 'OK', style: 'default' }]
        )
        return
      }

      await setAgeVerified(true, dateOfBirth)
      logger.info('Age verification successful')
      onVerified(true)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Age verification failed', err)
      Alert.alert('Error', 'Failed to verify age. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Age Verification</Text>
        <Text style={styles.subtitle}>
          We need to verify that you're at least {requiredAge} years old to use PetSpark.
        </Text>

        <View style={styles.form}>
          <PremiumInput
            label="Date of Birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
            style={styles.input}
            accessibilityLabel="Enter your date of birth"
          />

          <PremiumButton
            onPress={() => void handleVerification()}
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
            style={styles.button}
          >
            Verify Age
          </PremiumButton>
        </View>

        <Text style={styles.disclaimer}>
          Your date of birth is stored securely and is only used for age verification.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  input: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  disclaimer: {
    ...typography['body-sm'],
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})