/**
 * Global Call Provider (Mobile)
 *
 * Wraps the app, exposes useCall(), and renders a global CallOverlay and incoming-call banner.
 * Location: apps/mobile/src/contexts/CallContext.native.tsx
 */
import React, { createContext, useContext, useMemo, useCallback } from 'react'
import type { PropsWithChildren } from 'react'
import type { CallSession } from '@petspark/core'
import { useCallManager } from '@/hooks/call/use-call-manager'
import { useUserStore } from '@/store/user-store'
import { CallOverlay } from '@/components/call/CallOverlay.native'
import { IncomingCallNotification } from '@/components/call/IncomingCallNotification'

interface CallContextValue {
  readonly status: 'idle' | 'incoming' | 'outgoing' | 'connecting' | 'active' | 'ended'
  readonly session: CallSession | null
  readonly startCall: (remoteUserId: string, remoteName: string, remotePhoto?: string) => Promise<void>
  readonly acceptIncomingCall: () => Promise<void>
  readonly rejectIncomingCall: () => Promise<void>
  readonly endCall: () => Promise<void>
  readonly toggleMute: () => void
  readonly toggleCamera: () => void
}

const CallContext = createContext<CallContextValue | undefined>(undefined)

export function CallProvider({ children }: PropsWithChildren): React.ReactElement {
  const user = useUserStore((s) => s.user)
  const localUserId = user?.id ?? 'current-user'

  const manager = useCallManager({ localUserId })

  const ctx: CallContextValue = useMemo(
    () => ({
      status: manager.callStatus,
      session: manager.session,
      startCall: manager.startCall,
      acceptIncomingCall: manager.acceptCall,
      rejectIncomingCall: manager.declineCall,
      endCall: manager.endCall,
      toggleMute: manager.toggleMute,
      toggleCamera: manager.toggleCamera,
    }),
    [manager]
  )

  const handleAccept = useCallback(() => {
    void manager.acceptCall()
  }, [manager])

  const handleDecline = useCallback(() => {
    void manager.declineCall()
  }, [manager])

  return (
    <CallContext.Provider value={ctx}>
      {children}
      {/* Global Incoming-Call notification */}
      {manager.hasIncomingCall && manager.incomingCall && (
        <IncomingCallNotification
          visible={manager.callStatus === 'incoming'}
          caller={{
            id: manager.incomingCall.remoteUserId,
            name: manager.incomingCall.remoteName,
            ...(manager.incomingCall.remotePhoto ? { photo: manager.incomingCall.remotePhoto } : {}),
          }}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}

      {/* Global Call Overlay */}
      <CallOverlay
        visible={manager.callStatus === 'active' || manager.callStatus === 'outgoing' || manager.callStatus === 'connecting'}
        session={manager.session}
        localStream={manager.callState?.localStream ?? null}
        remoteStream={manager.callState?.remoteStream ?? null}
        onEnd={manager.endCall}
        onToggleMute={manager.toggleMute}
        onToggleCamera={manager.toggleCamera}
        status={manager.callStatus}
      />
    </CallContext.Provider>
  )
}

export function useCall(): CallContextValue {
  const value = useContext(CallContext)
  if (!value) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return value
}
