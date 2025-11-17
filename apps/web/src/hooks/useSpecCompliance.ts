import { useState, useEffect, useCallback } from 'react'
import type { MergedSpec } from '@petspark/spec-core'

export interface SpecComplianceStatus {
  compliant: boolean
  missingSecrets: string[]
  missingCredentials: string[]
  disabledPacks: string[]
}

/**
 * Hook to check spec compliance status
 */
export function useSpecCompliance(mergedSpec?: MergedSpec): SpecComplianceStatus {
  const [status, setStatus] = useState<SpecComplianceStatus>({
    compliant: true,
    missingSecrets: [],
    missingCredentials: [],
    disabledPacks: [],
  })

  useEffect(() => {
    if (!mergedSpec) {
      return
    }

    const missingSecrets: string[] = []
    const missingCredentials: string[] = []

    if (mergedSpec.configuration.env) {
      for (const key of Object.keys(mergedSpec.configuration.env)) {
        const value = process.env[key] ?? import.meta.env[key]
        if (!value) {
          missingSecrets.push(key)
        }
      }
    }

    if (mergedSpec.configuration.credentials?.required) {
      for (const cred of mergedSpec.configuration.credentials.required) {
        const value = localStorage.getItem(`credential:${cred}`)
        if (!value) {
          missingCredentials.push(cred)
        }
      }
    }

    setStatus({
      compliant: missingSecrets.length === 0 && missingCredentials.length === 0,
      missingSecrets,
      missingCredentials,
      disabledPacks: [],
    })
  }, [mergedSpec])

  return status
}



