/**
 * Call Grid
 *
 * Grid layout for 1-on-1 and group calls (up to 8 participants)
 */

'use client';

import { useMemo } from 'react';
import { CallParticipantTile } from './CallParticipantTile';
import { cn } from '@/lib/utils';
import type { CallParticipant } from '@/lib/calls/call-types';

export interface CallGridProps {
  participants: {
    participant: CallParticipant;
    stream: MediaStream | null;
  }[];
  localParticipant: CallParticipant;
  localStream: MediaStream | null;
  className?: string;
}

function getGridLayout(count: number): string {
  if (count === 1) {
    return 'grid-cols-1';
  }
  if (count === 2) {
    return 'grid-cols-2';
  }
  if (count <= 4) {
    return 'grid-cols-2';
  }
  if (count <= 6) {
    return 'grid-cols-3';
  }
  return 'grid-cols-4';
}

export function CallGrid({
  participants,
  localParticipant,
  localStream,
  className,
}: CallGridProps): React.JSX.Element {
  const allParticipants = useMemo(() => {
    const result = [
      {
        participant: localParticipant,
        stream: localStream,
      },
      ...participants,
    ];
    return result.slice(0, 8);
  }, [participants, localParticipant, localStream]);

  const gridLayout = getGridLayout(allParticipants.length);

  return (
    <div
      className={cn(
        'grid gap-4 h-full w-full',
        gridLayout,
        'p-4 md:p-6',
        className
      )}
    >
      {allParticipants.map(({ participant, stream }, index) => (
        <CallParticipantTile
          key={participant.id}
          stream={stream}
          displayName={participant.displayName}
          avatarUrl={participant.avatarUrl}
          isLocal={participant.isLocal}
          isMuted={participant.microphone === 'muted'}
          isCameraOff={participant.camera === 'off'}
          emphasis={index === 0 ? 'primary' : 'secondary'}
          className="min-h-[200px]"
        />
      ))}
    </div>
  );
}

