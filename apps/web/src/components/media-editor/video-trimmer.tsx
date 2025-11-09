'use client';

import { getVideoThumbnails } from '@/core/services/media/video/thumbnails';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

export interface VideoTrimmerProps {
  uri: string;
  durationSec?: number;
  onChange: (startSec: number, endSec: number) => void;
}

export function VideoTrimmer({
  uri,
  durationSec = 0,
  onChange,
}: VideoTrimmerProps): React.ReactElement {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [width, setWidth] = useState(0);
  const start = useSharedValue(0); // px from left
  const end = useSharedValue(0); // px from left
  const handleW = 16;

  useEffect(() => {
    let cancelled = false;

    getVideoThumbnails(uri, 8).then((thumbnails) => {
      if (!cancelled) {
        setThumbs(thumbnails);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  const pxToSec = useMemo(() => {
    return (px: number): number => {
      if (!width || durationSec === 0) {
        return 0;
      }
      return Math.max(0, Math.min(durationSec, (px / width) * durationSec));
    };
  }, [width, durationSec]);

  const update = useCallback(() => {
    const startSec = pxToSec(start.value);
    const endSec = pxToSec(end.value);
    onChange(Math.min(startSec, endSec), Math.max(startSec, endSec));
  }, [pxToSec, onChange, start, end]);

  const onLayout = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const w = e.currentTarget.offsetWidth;
      setWidth(w);
      end.value = w;
    },
    [end]
  );

  const panStart = Gesture.Pan()
    .onChange((g) => {
      const newValue = Math.max(0, Math.min(start.value + g.changeX, end.value - handleW));
      start.value = newValue;
    })
    .onEnd(() => {
      runOnJS(update)();
    });

  const panEnd = Gesture.Pan()
    .onChange((g) => {
      const newValue = Math.min(width, Math.max(end.value + g.changeX, start.value + handleW));
      end.value = newValue;
    })
    .onEnd(() => {
      runOnJS(update)();
    });

  const asStart = useAnimatedStyle(() => ({
    transform: [{ translateX: start.value }],
  }));

  const asEnd = useAnimatedStyle(() => ({
    transform: [{ translateX: end.value - handleW }],
  }));

  const asMask = useAnimatedStyle(() => {
    const maskWidth = Math.max(handleW, end.value - start.value);
    return {
      left: start.value,
      width: maskWidth,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trim</Text>
      <View style={styles.timeline} onLayout={onLayout}>
        <View style={styles.thumbsRow}>
          {thumbs.length > 0 ? (
            thumbs.map((thumb, i) => (
              <Image key={i} source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
            ))
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <Animated.View style={[styles.mask, asMask]} />

        <GestureDetector gesture={panStart}>
          <Animated.View style={[styles.handle, asStart]} />
        </GestureDetector>
        <GestureDetector gesture={panEnd}>
          <Animated.View style={[styles.handle, asEnd]} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  timeline: {
    position: 'relative',
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#666',
    backgroundColor: '#222',
  },
  thumbsRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  thumb: {
    flex: 1,
    height: '100%',
  },
  placeholder: {
    flex: 1,
    height: '100%',
    backgroundColor: '#333',
  },
  handle: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: '100%',
    backgroundColor: '#444',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#666',
    zIndex: 10,
  },
  mask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    pointerEvents: 'none',
  },
});
