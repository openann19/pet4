/**
 * Network status hook
 * Location: src/hooks/use-network-status.ts
 */

import type { NetInfoState } from '@react-native-community/netinfo'
import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

export interface NetworkStatus {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string | null
}

export function useNetworkStatus(): NetworkStatus {
  const [networkState, setNetworkState] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  })

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type ?? null,
      })
    })

    // Get initial state
    void NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type ?? null,
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return networkState
}
