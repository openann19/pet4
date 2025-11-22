/**
 * Age Verification Utility (Mobile)
 * 
 * Handles age verification checks for mobile app access
 */

import { createLogger } from './logger'
import { getSecureValue, saveSecureValue, deleteSecureValue } from './secure-storage'

const logger = createLogger('AgeVerification')

export interface AgeVerificationStatus {
  isVerified: boolean
  verifiedAt?: string
  dateOfBirth?: string
}

const AGE_VERIFICATION_KEY = 'age_verification_status'
const MINIMUM_AGE = 13 // Minimum age requirement

/**
 * Check if user is age verified
 */
export async function isAgeVerified(): Promise<boolean> {
  try {
    const statusJson = await getSecureValue(AGE_VERIFICATION_KEY)
    if (!statusJson) {
      return false
    }

    const status: AgeVerificationStatus = JSON.parse(statusJson)
    return status.isVerified === true
  } catch (error) {
    logger.warn('Failed to check age verification status', { error })
    return false
  }
}

/**
 * Set age verification status
 */
export async function setAgeVerified(isVerified: boolean, dateOfBirth?: string): Promise<void> {
  try {
    const status: AgeVerificationStatus = {
      isVerified,
      ...(isVerified ? { verifiedAt: new Date().toISOString() } : {}),
      ...(dateOfBirth ? { dateOfBirth } : {})
    }

    await saveSecureValue(AGE_VERIFICATION_KEY, JSON.stringify(status))
    logger.info('Age verification status updated', { isVerified })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to set age verification status', err)
    throw err
  }
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Verify if date of birth meets minimum age requirement
 */
export function verifyMinimumAge(dateOfBirth: string): boolean {
  const age = calculateAge(dateOfBirth)
  return age >= MINIMUM_AGE
}

/**
 * Get age verification status
 */
export async function getAgeVerificationStatus(): Promise<AgeVerificationStatus | null> {
  try {
    const statusJson = await getSecureValue(AGE_VERIFICATION_KEY)
    if (!statusJson) {
      return null
    }
    return JSON.parse(statusJson) as AgeVerificationStatus
  } catch (error) {
    logger.warn('Failed to get age verification status', { error })
    return null
  }
}

/**
 * Clear age verification (for testing/development)
 */
export async function clearAgeVerification(): Promise<void> {
  try {
    await deleteSecureValue(AGE_VERIFICATION_KEY)
    logger.info('Age verification cleared')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to clear age verification', err)
    throw err
  }
}