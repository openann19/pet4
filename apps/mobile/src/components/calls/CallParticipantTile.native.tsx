/**
 * Call Participant Tile (Mobile)
 *
 * Native video tile for call participants
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { MicOff, VideoOff } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { getTypographyStyle } from '@/theme/typography';

export interface CallParticipantTileProps {
  stream: MediaStream | null;
  displayName: string;
  avatarUrl?: string | null;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  emphasis?: 'primary' | 'secondary';
  style?: object;
}

export function CallParticipantTile({
  stream,
  displayName,
  avatarUrl,
  isLocal,
  isMuted,
  isCameraOff,
  emphasis = 'primary',
  style,
}: CallParticipantTileProps): React.JSX.Element {
  const showVideo = Boolean(stream) && !isCameraOff;

  return (
    <View style={[styles.container, emphasis === 'primary' && styles.primary, style]}>
      {showVideo ? (
        <RTCView
          streamURL={stream?.toURL() ?? ''}
          style={styles.video}
          objectFit="cover"
          mirror={isLocal}
        />
      ) : (
        <View style={styles.placeholder}>
          {avatarUrl ? (
            <View style={styles.avatarContainer}>
              <Text style={[getTypographyStyle('h2'), styles.avatarText]}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.avatarContainer}>
              <Text style={[getTypographyStyle('h2'), styles.avatarText]}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[getTypographyStyle('body'), styles.nameText]}>
            {displayName}
            {isLocal && ' (You)'}
          </Text>
        </View>
      )}

      {!showVideo && isCameraOff && (
        <View style={styles.cameraOffOverlay}>
          <VideoOff size={24} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.nameContainer}>
          <Text style={[getTypographyStyle('body'), styles.nameText]} numberOfLines={1}>
            {displayName}
            {isLocal && ' (You)'}
          </Text>
        </View>

        {isMuted && (
          <View style={styles.mutedBadge}>
            <MicOff size={16} color={colors.foreground} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primary: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    gap: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.primaryForeground,
  },
  nameText: {
    color: colors.foreground,
  },
  cameraOffOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  nameContainer: {
    flex: 1,
  },
  mutedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

