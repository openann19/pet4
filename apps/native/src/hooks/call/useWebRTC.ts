import { useState, useCallback, useEffect } from 'react';

export interface CallState {
  isConnecting: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  error: string | null;
}

export const useWebRTC = (_callId: string, _remoteUserId: string) => {
  const [callState, setCallState] = useState<CallState>({
    isConnecting: true,
    isConnected: false,
    isMuted: false,
    isCameraOn: true,
    error: null,
  });

  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setCallState((prev) => ({
        ...prev,
        isConnecting: false,
        isConnected: true,
      }));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const toggleMute = useCallback(() => {
    setCallState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
    // NOTE: WebRTC mute implementation pending - currently updates UI state only
  }, []);

  const toggleCamera = useCallback(() => {
    setCallState((prev) => ({
      ...prev,
      isCameraOn: !prev.isCameraOn,
    }));
    // NOTE: WebRTC camera toggle implementation pending - currently updates UI state only
  }, []);

  const endCall = useCallback(() => {
    // NOTE: WebRTC cleanup implementation pending - currently updates UI state only
    setCallState((prev) => ({
      ...prev,
      isConnected: false,
    }));
  }, []);

  return {
    callState,
    toggleMute,
    toggleCamera,
    endCall,
  };
};
