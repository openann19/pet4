import { Platform } from 'react-native'

const vibrate = (duration: number) => {
  if (Platform.OS === 'ios') {
    // iOS haptics via native module or fallback
    return
  }
  // Android vibration
  if (Platform.OS === 'android') {
    const { Vibration } = require('react-native')
    Vibration.vibrate(duration)
  }
}

export const haptics = {
  impact: (type: 'light' | 'medium' | 'heavy' = 'light') => {
    switch (type) {
      case 'light':
        vibrate(10)
        break
      case 'medium':
        vibrate(20)
        break
      case 'heavy':
        vibrate(40)
        break
    }
  },
  selection: () => {
    vibrate(10)
  },
  success: () => {
    vibrate(20)
  },
  error: () => {
    vibrate(40)
  },
}

