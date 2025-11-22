/**
 * Type declarations for useCallManager hook
 */

declare module '@mobile/hooks/call/useCallManager' {
  export interface CallInfo {
    callId: string;
    participants: string[];
    status: 'ringing' | 'active' | 'ended';
    startTime?: number;
    endTime?: number;
  }

  export interface UseCallManagerReturn {
    activeCall: CallInfo | null;
    startCall: (participantIds: string[]) => Promise<void>;
    endCall: () => Promise<void>;
    answerCall: (callId: string) => Promise<void>;
    rejectCall: (callId: string) => Promise<void>;
    session?: unknown;
  }

  export function useCallManager(): UseCallManagerReturn;
}

