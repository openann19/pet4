import { Platform } from 'react-native';
// If using Expo: import * as Haptics from 'expo-haptics';
let Haptics: any; 
try { 
  Haptics = require('expo-haptics'); 
} catch {
  // expo-haptics not available
}

export const haptic = {
  light()  { if (Platform.OS !== 'web' && Haptics?.impactAsync) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
  medium() { if (Platform.OS !== 'web' && Haptics?.impactAsync) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
  heavy()  { if (Platform.OS !== 'web' && Haptics?.impactAsync) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); },
};

