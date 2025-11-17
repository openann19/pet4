/**
 * Sync Status Component (Web)
 *
 * Displays sync status and progress for offline-first architecture.
 * Shows pending actions, sync progress, and error states.
 *
 * Location: apps/web/src/components/offline/SyncStatus.tsx
 */

import { useEffect, useState } from 'react'
import { getOfflineSyncManager, type SyncStatus } from '@/lib/offline-sync'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SyncStatus')

/**
 * Sync status component props
 */
export interface SyncStatusProps {
    readonly className?: string
    readonly showProgress?: boolean
    readonly showDetails?: boolean
}

/**
 * Sync Status Component
 *
 * @example
 * ```tsx
 * <SyncStatus showProgress={true} showDetails={true} />
 * ```
 */
export function SyncStatus({
    className = '',
    showProgress = true,
    showDetails = false,
}: SyncStatusProps): JSX.Element {
    const [status, setStatus] = useState<SyncStatus>(getOfflineSyncManager().getStatus())

    useEffect(() => {
        const syncManager = getOfflineSyncManager()
        const unsubscribe = syncManager.subscribe((newStatus) => {
            setStatus(newStatus)
            logger.debug('Sync status updated', newStatus)
        })

        // Initial status
        setStatus(syncManager.getStatus())

        return () => {
            unsubscribe()
        }
    }, [])

    if (!status.isOnline && status.pendingActions === 0) {
        return <></>
    }

    return (
        <div className={`sync-status ${className}`} role="status" aria-live="polite">
            {status.isSyncing && showProgress && (
                <div className="sync-progress">
                    <div className="sync-progress-bar">
                        <div
                            className="sync-progress-fill"
                            style={{ width: `${status.progress ?? 0}%` }}
                            aria-valuenow={status.progress ?? 0}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            role="progressbar"
                        />
                    </div>
                    {status.currentAction && (
                        <span className="sync-progress-text">{status.currentAction}</span>
                    )}
                </div>
            )}

            {showDetails && (
                <div className="sync-details">
                    <div className="sync-detail-item">
                        <span className="sync-detail-label">Status:</span>
                        <span className={`sync-detail-value ${status.isOnline ? 'online' : 'offline'}`}>
                            {status.isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>

                    {status.isSyncing && (
                        <div className="sync-detail-item">
                            <span className="sync-detail-label">Syncing:</span>
                            <span className="sync-detail-value">{status.progress ?? 0}%</span>
                        </div>
                    )}

                    <div className="sync-detail-item">
                        <span className="sync-detail-label">Pending:</span>
                        <span className="sync-detail-value">{status.pendingActions}</span>
                    </div>

                    {status.failedActions > 0 && (
                        <div className="sync-detail-item">
                            <span className="sync-detail-label">Failed:</span>
                            <span className="sync-detail-value error">{status.failedActions}</span>
                        </div>
                    )}

                    {status.lastSyncTime && (
                        <div className="sync-detail-item">
                            <span className="sync-detail-label">Last sync:</span>
                            <span className="sync-detail-value">
                                {new Date(status.lastSyncTime).toLocaleTimeString()}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {!status.isSyncing && status.pendingActions > 0 && (
                <div className="sync-pending">
                    <span className="sync-pending-text">
                        {status.pendingActions} action{status.pendingActions !== 1 ? 's' : ''} pending
                    </span>
                </div>
            )}

            {status.failedActions > 0 && (
                <div className="sync-error">
                    <span className="sync-error-text">
                        {status.failedActions} action{status.failedActions !== 1 ? 's' : ''} failed
                    </span>
                </div>
            )}
        </div>
    )
}
