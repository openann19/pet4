/**
 * Age Verification Component
 * 
 * COPPA compliance - verifies user age before allowing access
 */

import { useState } from 'react'
import { createLogger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const logger = createLogger('AgeVerification')

const MINIMUM_AGE = 13
const AGE_VERIFICATION_KEY = 'petspark:age-verified'

interface AgeVerificationProps {
  onVerified: (isVerified: boolean) => void
  requiredAge?: number
}

export function AgeVerification({ onVerified, requiredAge = MINIMUM_AGE }: AgeVerificationProps) {
  const [birthDate, setBirthDate] = useState({ year: '', month: '', day: '' })
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

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

  const handleVerify = () => {
    setError(null)

    if (!birthDate.year || !birthDate.month || !birthDate.day) {
      setError('Please enter your complete date of birth')
      return
    }

    const year = parseInt(birthDate.year, 10)
    const month = parseInt(birthDate.month, 10)
    const day = parseInt(birthDate.day, 10)

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      setError('Please enter a valid date')
      return
    }

    const age = calculateAge(year, month, day)

    if (age < requiredAge) {
      setError(`You must be at least ${requiredAge} years old to use this service.`)
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
      sessionStorage.setItem(AGE_VERIFICATION_KEY, JSON.stringify(verificationData))
      logger.debug('Age verification completed', { age })
      onVerified(true)
    } catch (error) {
      logger.error('Failed to store age verification', error instanceof Error ? error : new Error(String(error)))
      onVerified(true) // Still allow access if storage fails
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Age Verification</CardTitle>
          <CardDescription>
            To comply with COPPA regulations, we need to verify that you are at least {requiredAge} years old.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={birthDate.month}
                onValueChange={(value) => setBirthDate({ ...birthDate, month: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {month.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={birthDate.day}
                onValueChange={(value) => setBirthDate({ ...birthDate, day: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={birthDate.year}
                onValueChange={(value) => setBirthDate({ ...birthDate, year: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button onClick={handleVerify} className="w-full" size="lg">
            Verify Age
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your date of birth is only used for age verification and is not stored permanently.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Check if user has already verified their age
 */
export function isAgeVerified(): boolean {
  try {
    const stored = sessionStorage.getItem(AGE_VERIFICATION_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as { verified: boolean; age: number }
      return parsed.verified === true && parsed.age >= MINIMUM_AGE
    }
  } catch (error) {
    logger.warn('Failed to check age verification', { error })
  }
  return false
}

