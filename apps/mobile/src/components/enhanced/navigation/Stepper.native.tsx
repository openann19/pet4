import React, { useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy, isDefined } from '@/core/guards';

const AnimatedView = Animated.View
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface StepperStep {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  optional?: boolean
}

export interface StepperProps {
  steps: StepperStep[]
  currentStep: number
  onStepPress?: (stepIndex: number) => void
  orientation?: 'horizontal' | 'vertical'
  style?: ViewStyle
  testID?: string
}

const SPRING_CONFIG = { stiffness: 400, damping: 20 }

export function Stepper({
  steps,
  currentStep,
  onStepPress,
  orientation = 'horizontal',
  style,
  testID = 'stepper',
}: StepperProps): React.JSX.Element {
  const progressWidth = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  const progressStyle = useAnimatedStyle(() => ({
    width: `${String(progressWidth.value ?? '')}%`,
  }))

  const handleStepPress = useCallback(
    (index: number) => {
      if (onStepPress && index <= currentStep) {
        onStepPress(index)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    },
    [onStepPress, currentStep]
  )

  const progressPercentage = steps.length > 1
    ? (currentStep / (steps.length - 1)) * 100
    : 0

  if (isTruthy(reducedMotion.value)) {
    progressWidth.value = withTiming(progressPercentage, { duration: 300 })
  } else {
    progressWidth.value = withSpring(progressPercentage, SPRING_CONFIG)
  }

  if (orientation === 'vertical') {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <View key={step.id} style={styles.verticalStep}>
              <View style={styles.verticalStepContent}>
                <AnimatedPressable
                  onPress={() => { handleStepPress(index); }}
                  disabled={isUpcoming}
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent,
                    isUpcoming && styles.stepCircleUpcoming,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isUpcoming }}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      isCompleted && styles.stepNumberCompleted,
                      isCurrent && styles.stepNumberCurrent,
                      isUpcoming && styles.stepNumberUpcoming,
                    ]}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </Text>
                </AnimatedPressable>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.verticalLine,
                      isCompleted && styles.verticalLineCompleted,
                    ]}
                  />
                )}
              </View>
              <View style={styles.verticalStepLabel}>
                <Pressable
                  onPress={() => { handleStepPress(index); }}
                  disabled={isUpcoming}
                >
                  <Text
                    style={[
                      styles.stepLabel,
                      (isCompleted || isCurrent) && styles.stepLabelActive,
                      isUpcoming && styles.stepLabelUpcoming,
                    ]}
                  >
                    {step.label}
                    {step.optional && (
                      <Text style={styles.optionalText}> (Optional)</Text>
                    )}
                  </Text>
                  {step.description && (
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.horizontalContainer}>
        <View style={styles.progressTrack} />
        <AnimatedView style={[styles.progressFill, progressStyle]} />
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <View key={step.id} style={styles.horizontalStep}>
              <AnimatedPressable
                onPress={() => { handleStepPress(index); }}
                disabled={isUpcoming}
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isCurrent && styles.stepCircleCurrent,
                  isUpcoming && styles.stepCircleUpcoming,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: isUpcoming }}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    isCompleted && styles.stepNumberCompleted,
                    isCurrent && styles.stepNumberCurrent,
                    isUpcoming && styles.stepNumberUpcoming,
                  ]}
                >
                  {isCompleted ? '✓' : index + 1}
                </Text>
              </AnimatedPressable>
              <View style={styles.horizontalStepLabel}>
                <Text
                  style={[
                    styles.stepLabel,
                    (isCompleted || isCurrent) && styles.stepLabelActive,
                    isUpcoming && styles.stepLabelUpcoming,
                  ]}
                >
                  {step.label}
                </Text>
                {step.description && (
                  <Text style={styles.stepDescription}>{step.description}</Text>
                )}
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
    paddingTop: 20,
  },
  progressTrack: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  progressFill: {
    position: 'absolute',
    top: 20,
    left: 0,
    height: 2,
    backgroundColor: '#3b82f6',
  },
  horizontalStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  stepCircleCompleted: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  stepCircleCurrent: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    transform: [{ scale: 1.1 }],
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepCircleUpcoming: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  stepNumberCompleted: {
    color: '#ffffff',
  },
  stepNumberCurrent: {
    color: '#ffffff',
  },
  stepNumberUpcoming: {
    color: '#64748b',
  },
  horizontalStepLabel: {
    marginTop: 8,
    alignItems: 'center',
  },
  verticalStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  verticalStepContent: {
    alignItems: 'center',
    marginRight: 16,
  },
  verticalLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
  },
  verticalLineCompleted: {
    backgroundColor: '#3b82f6',
  },
  verticalStepLabel: {
    flex: 1,
    paddingBottom: 32,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  stepLabelActive: {
    color: '#000000',
  },
  stepLabelUpcoming: {
    color: '#64748b',
  },
  stepDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  optionalText: {
    fontWeight: '400',
    color: '#94a3b8',
  },
})

