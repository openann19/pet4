import React, { useMemo } from "react"
import { View, StyleSheet, PanResponder, Animated, AccessibilityRole } from "react-native"
import type { ViewStyle } from "react-native"

// Inline theme fallback instead of requiring navigation
const useTheme = () => ({
  colors: {
    border: "#ddd",
  },
})

export type SliderProps = {
  min?: number
  max?: number
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  style?: ViewStyle
  accessibilityRole?: AccessibilityRole
}

export const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  value,
  defaultValue,
  onValueChange,
  style,
  accessibilityRole = "adjustable",
}) => {
  const theme = useTheme()
  const _values = useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  // Basic animated slider logic (single thumb)
  const pan = React.useRef(new Animated.Value(_values[0])).current

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      let newValue = Math.max(min, Math.min(max, gestureState.dx + _values[0]))
      pan.setValue(newValue)
      onValueChange?.([newValue])
    },
  })

  return (
    <View
      style={[styles.track, { backgroundColor: theme.colors.border }, style]}
      accessibilityRole={accessibilityRole}
      accessible
    >
      <Animated.View
        style={[styles.range, { left: pan }]} // Simplified for demo
      />
      <Animated.View
        style={styles.thumb}
        {...panResponder.panHandlers}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 32,
    borderRadius: 16,
    width: "100%",
    justifyContent: "center",
    position: "relative",
  },
  range: {
    position: "absolute",
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    width: 60,
  },
  thumb: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007AFF",
    elevation: 2,
    top: 0,
    left: 0,
  },
})
