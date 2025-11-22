import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { SpringConfig } from '../animations/springConfigs';

interface PullToRefreshProps {
  refreshing: boolean;
  progress: number;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshProps> = ({ refreshing, progress }) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (refreshing) {
      rotation.value = withSpring(360, SpringConfig.smooth);
    } else {
      rotation.value = 0;
    }
  }, [refreshing, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress, [0, 1], [0.5, 1], Extrapolate.CLAMP);
    const opacity = interpolate(progress, [0, 0.5, 1], [0, 0.5, 1], Extrapolate.CLAMP);

    return {
      transform: [{ scale }, { rotate: `${rotation.value}deg` }],
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, animatedStyle]}>
        <Text style={styles.icon}>↻</Text>
      </Animated.View>
      {refreshing && <Text style={styles.text}>Refreshing...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
