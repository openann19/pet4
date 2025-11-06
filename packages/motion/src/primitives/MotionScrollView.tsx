import Animated from 'react-native-reanimated';

export function MotionScrollView(props: React.ComponentProps<typeof Animated.ScrollView>) {
  return <Animated.ScrollView {...props} />;
}

