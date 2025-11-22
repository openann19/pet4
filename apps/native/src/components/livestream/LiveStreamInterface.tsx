import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { StreamControls } from './StreamControls';
import { LiveChatOverlay } from './LiveChatOverlay';
import { ViewersList } from './ViewersList';

interface LiveStreamInterfaceProps {
  streamId: string;
  hostName: string;
  hostPhoto?: string;
  isHost: boolean;
  onEndStream: () => void;
}

export const LiveStreamInterface: React.FC<LiveStreamInterfaceProps> = ({
  streamId,
  hostName,
  hostPhoto: _hostPhoto,
  isHost,
  onEndStream,
}) => {
  const [viewersCount] = useState(1);
  const [duration, setDuration] = useState(0);
  const [showViewersList, setShowViewersList] = useState(false);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Pulse animation for live badge
    pulseScale.value = withRepeat(withTiming(1.1, { duration: 1000 }), -1, true);

    // Duration timer
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Video Feed Area */}
      <View style={styles.videoFeed}>
        <View style={styles.placeholderVideo}>
          <Text style={styles.placeholderText}>Live Video Feed</Text>
        </View>
      </View>

      {/* Top Overlay */}
      <View style={styles.topOverlay}>
        <View style={styles.topLeft}>
          <Animated.View style={[styles.liveBadge, pulseStyle]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </Animated.View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.viewersButton} onPress={() => setShowViewersList(true)}>
          <Text style={styles.viewersIcon}>👥</Text>
          <Text style={styles.viewersText}>{viewersCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Host Info */}
      <View style={styles.hostInfo}>
        <View style={styles.hostAvatar}>
          <Text style={styles.hostAvatarText}>{hostName[0]}</Text>
        </View>
        <Text style={styles.hostName}>{hostName}</Text>
      </View>

      {/* Chat Overlay */}
      <LiveChatOverlay streamId={streamId} />

      {/* Controls (Host only) */}
      {isHost && (
        <StreamControls onEndStream={onEndStream} onShowViewers={() => setShowViewersList(true)} />
      )}

      {/* Viewers List Modal */}
      <Modal
        visible={showViewersList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowViewersList(false)}
      >
        <ViewersList streamId={streamId} onClose={() => setShowViewersList(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoFeed: {
    flex: 1,
  },
  placeholderVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#666',
    fontSize: 18,
  },
  topOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  liveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  durationBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  viewersIcon: {
    fontSize: 16,
  },
  viewersText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hostInfo: {
    position: 'absolute',
    top: 110,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hostName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
