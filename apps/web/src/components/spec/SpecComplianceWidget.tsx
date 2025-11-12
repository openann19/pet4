import { useMemo } from 'react'
import { useSpecCompliance } from '@/hooks/useSpecCompliance'
import type { MergedSpec } from '@petspark/spec-core'

export interface SpecComplianceWidgetProps {
  mergedSpec?: MergedSpec
  className?: string
}

/**
 * Spec compliance widget for admin UI
 */
export function SpecComplianceWidget({
  mergedSpec,
  className,
}: SpecComplianceWidgetProps): React.JSX.Element {
  const compliance = useSpecCompliance(mergedSpec)

  const statusColor = useMemo(() => {
    if (compliance.compliant) {
      return 'text-green-600 bg-green-50'
    }
    return 'text-red-600 bg-red-50'
  }, [compliance.compliant])

  const statusIcon = useMemo(() => {
    if (compliance.compliant) {
      return '✓'
    }
    return '✗'
  }, [compliance.compliant])

  return (
    <div className={`p-4 rounded-lg border ${statusColor} ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-semibold">{statusIcon}</span>
        <h3 className="text-lg font-semibold">Spec Compliance</h3>
      </div>

      {compliance.compliant ? (
        <p className="text-sm">All required secrets and credentials are configured.</p>
      ) : (
        <div className="space-y-2">
          {compliance.missingSecrets.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Missing Secrets:</p>
              <ul className="text-sm list-disc list-inside">
                {compliance.missingSecrets.map((secret) => (
                  <li key={secret}>{secret}</li>
                ))}
              </ul>
            </div>
          )}

          {compliance.missingCredentials.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Missing Credentials:</p>
              <ul className="text-sm list-disc list-inside">
                {compliance.missingCredentials.map((cred) => (
                  <li key={cred}>{cred}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
