/**
 * Age Verification Component (Mobile)
 * 
 * COPPA compliance - verifies user age before allowing access
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native'
import { EnhancedButton } from '@mobile/components/enhanced/EnhancedButton'
import { createLogger } from '@mobile/utils/logger'
import * as SecureStore from 'expo-secure-store'

const logger = createLogger('AgeVerification')

const MINIMUM_AGE = 13
const AGE_VERIFICATION_KEY = 'petspark:age-verified'

interface AgeVerificationProps {
  onVerified: (isVerified: boolean) => void
  requiredAge?: number
}

export function AgeVerification({ onVerified, requiredAge = MINIMUM_AGE }: AgeVerificationProps): React.JSX.Element {
  const [birthDate, setBirthDate] = useState({ year: '', month: '', day: '' })

  const calculateAge = (year: number, month: number, day: number): number => {
    const birthDate = new Date(year, month - 1, day)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const handleVerify = async (): Promise<void> => {
    if (!birthDate.year || !birthDate.month || !birthDate.day) {
      Alert.alert('Error', 'Please enter your complete date of birth')
      return
    }

    const year = parseInt(birthDate.year, 10)
    const month = parseInt(birthDate.month, 10)
    const day = parseInt(birthDate.day, 10)

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      Alert.alert('Error', 'Please enter a valid date')
      return
    }

    const age = calculateAge(year, month, day)

    if (age < requiredAge) {
      Alert.alert(
        'Age Restriction',
        `You must be at least ${requiredAge} years old to use this service.`
      )
      onVerified(false)
      return
    }

    // Store verification
    try {
      const verificationData = {
        verified: true,
        age,
        timestamp: new Date().toISOString()
      }
      await SecureStore.setItemAsync(AGE_VERIFICATION_KEY, JSON.stringify(verificationData))
      logger.debug('Age verification completed', { age })
      onVerified(true)
    } catch (error) {
      logger.error('Failed to store age verification', error instanceof Error ? error : new Error(String(error)))
      onVerified(true) // Still allow access if storage fails
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Age Verification</Text>
        <Text style={styles.description}>
          To comply with COPPA regulations, we need to verify that you are at least {requiredAge} years old.
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Month</Text>
            <TextInput
              style={styles.input}
              placeholder="MM"
              value={birthDate.month}
              onChangeText={(value) => setBirthDate({ ...birthDate, month: value })}
              keyboardType="number-pad"
              maxLength={2}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Day</Text>
            <TextInput
              style={styles.input}
              placeholder="DD"
              value={birthDate.day}
              onChangeText={(value) => setBirthDate({ ...birthDate, day: value })}
              keyboardType="number-pad"
              maxLength={2}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY"
              value={birthDate.year}
              onChangeText={(value) => setBirthDate({ ...birthDate, year: value })}
              keyboardType="number-pad"
              maxLength={4}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <EnhancedButton
          title="Verify Age"
          onPress={handleVerify}
          variant="primary"
          size="lg"
          style={styles.button}
        />

        <Text style={styles.footer}>
          Your date of birth is only used for age verification and is not stored permanently.
        </Text>
      </View>
    </View>
  )
}

/**
 * Check if user has already verified their age
 */
export async function isAgeVerified(): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(AGE_VERIFICATION_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as { verified: boolean; age: number }
      return parsed.verified === true && parsed.age >= MINIMUM_AGE
    }
  } catch (error) {
    logger.warn('Failed to check age verification', { error })
  }
  return false
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center'
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8
  },
  inputWrapper: {
    flex: 1
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  button: {
    marginBottom: 16
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center'
  }
})

