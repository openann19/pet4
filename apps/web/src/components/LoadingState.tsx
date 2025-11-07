import { useEffect } from 'react'
import { PawPrint, Heart } from '@phosphor-icons/react'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export default function LoadingState() {
  // Main container scale animation
  const mainScale = useSharedValue(1)
  
  // Outer glow ring animations
  const outerScale = useSharedValue(1)
  const outerOpacity = useSharedValue(0.4)
  const outerRotate = useSharedValue(0)
  
  // Middle glow ring animations
  const middleScale = useSharedValue(1)
  const middleOpacity = useSharedValue(0.3)
  const middleRotate = useSharedValue(360)
  
  // Center icon rotation
  const centerRotate = useSharedValue(0)
  const iconRotate = useSharedValue(0)
  
  // Floating hearts animations
  const heart1Y = useSharedValue(-20)
  const heart1Opacity = useSharedValue(0)
  const heart1Scale = useSharedValue(0.5)
  
  const heart2Y = useSharedValue(-20)
  const heart2Opacity = useSharedValue(0)
  const heart2Scale = useSharedValue(0.5)
  
  const heart3Y = useSharedValue(-20)
  const heart3Opacity = useSharedValue(0)
  const heart3Scale = useSharedValue(0.5)
  
  // Text container animations
  const textOpacity = useSharedValue(0)
  const textY = useSharedValue(10)
  
  // Dots animations
  const dot1Scale = useSharedValue(1)
  const dot1Opacity = useSharedValue(0.4)
  const dot2Scale = useSharedValue(1)
  const dot2Opacity = useSharedValue(0.4)
  const dot3Scale = useSharedValue(1)
  const dot3Opacity = useSharedValue(0.4)
  const dot4Scale = useSharedValue(1)
  const dot4Opacity = useSharedValue(0.4)
  
  const dotsOpacity = useSharedValue(0)

  useEffect(() => {
    // Main container scale
    mainScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1250 }),
        withTiming(1, { duration: 1250 })
      ),
      -1,
      false
    )
    
    // Outer glow ring
    outerScale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    )
    outerOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      false
    )
    outerRotate.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    )
    
    // Middle glow ring
    middleScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1250 }),
        withTiming(1, { duration: 1250 })
      ),
      -1,
      false
    )
    middleOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1250 }),
        withTiming(0.3, { duration: 1250 })
      ),
      -1,
      false
    )
    middleRotate.value = withRepeat(
      withTiming(0, { duration: 2500 }),
      -1,
      false
    )
    
    // Center icon rotation
    centerRotate.value = withRepeat(
      withTiming(360, { duration: 4000 }),
      -1,
      false
    )
    iconRotate.value = withRepeat(
      withTiming(-360, { duration: 4000 }),
      -1,
      false
    )
    
    // Floating hearts
    heart1Y.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: 1000 }),
        withTiming(-20, { duration: 1000 })
      ),
      -1,
      false
    )
    heart1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    )
    heart1Scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      false
    )
    
    setTimeout(() => {
      heart2Y.value = withRepeat(
        withSequence(
          withTiming(-40, { duration: 1000 }),
          withTiming(-20, { duration: 1000 })
        ),
        -1,
        false
      )
      heart2Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
      heart2Scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        false
      )
    }, 400)
    
    setTimeout(() => {
      heart3Y.value = withRepeat(
        withSequence(
          withTiming(-40, { duration: 1000 }),
          withTiming(-20, { duration: 1000 })
        ),
        -1,
        false
      )
      heart3Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
      heart3Scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        false
      )
    }, 800)
    
    // Text container
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 500 })
      textY.value = withTiming(0, { duration: 500 })
    }, 300)
    
    // Dots container
    setTimeout(() => {
      dotsOpacity.value = withTiming(1, { duration: 500 })
    }, 500)
    
    // Individual dots
    dot1Scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    )
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 })
      ),
      -1,
      false
    )
    
    setTimeout(() => {
      dot2Scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      )
      dot2Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        false
      )
    }, 180)
    
    setTimeout(() => {
      dot3Scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      )
      dot3Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        false
      )
    }, 360)
    
    setTimeout(() => {
      dot4Scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      )
      dot4Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        false
      )
    }, 540)
  }, [mainScale, outerScale, outerOpacity, outerRotate, middleScale, middleOpacity, middleRotate, centerRotate, iconRotate, heart1Y, heart1Opacity, heart1Scale, heart2Y, heart2Opacity, heart2Scale, heart3Y, heart3Opacity, heart3Scale, textOpacity, textY, dotsOpacity, dot1Scale, dot1Opacity, dot2Scale, dot2Opacity, dot3Scale, dot3Opacity, dot4Scale, dot4Opacity])

  // Animated styles
  const mainStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mainScale.value }]
  })) as AnimatedStyle

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: outerScale.value },
      { rotate: `${String(outerRotate.value ?? '')}deg` }
    ],
    opacity: outerOpacity.value
  })) as AnimatedStyle

  const middleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: middleScale.value },
      { rotate: `${String(middleRotate.value ?? '')}deg` }
    ],
    opacity: middleOpacity.value
  })) as AnimatedStyle

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${String(centerRotate.value ?? '')}deg` }]
  })) as AnimatedStyle

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${String(iconRotate.value ?? '')}deg` }]
  })) as AnimatedStyle

  const heart1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: heart1Y.value },
      { scale: heart1Scale.value }
    ],
    opacity: heart1Opacity.value
  })) as AnimatedStyle

  const heart2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: heart2Y.value },
      { scale: heart2Scale.value }
    ],
    opacity: heart2Opacity.value
  })) as AnimatedStyle

  const heart3Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: heart3Y.value },
      { scale: heart3Scale.value }
    ],
    opacity: heart3Opacity.value
  })) as AnimatedStyle

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }]
  })) as AnimatedStyle

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value
  })) as AnimatedStyle

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
    opacity: dot1Opacity.value
  })) as AnimatedStyle

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
    opacity: dot2Opacity.value
  })) as AnimatedStyle

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
    opacity: dot3Opacity.value
  })) as AnimatedStyle

  const dot4Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot4Scale.value }],
    opacity: dot4Opacity.value
  })) as AnimatedStyle

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">                                                                     
      <AnimatedView
        style={mainStyle}
        className="relative w-28 h-28"
      >
        {/* Outer glow ring */}
        <AnimatedView
          style={outerStyle}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30"                                             
        />
        
        {/* Middle glow ring */}
        <AnimatedView
          style={middleStyle}
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-accent/30 to-primary/30"                                                              
        />
        
        {/* Center icon container */}
        <AnimatedView
          style={centerStyle}
          className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"                                                                   
        >
          <AnimatedView style={iconStyle}>
            <PawPrint size={40} weight="fill" className="text-primary drop-shadow-lg" />                                                                        
          </AnimatedView>
        </AnimatedView>

        {/* Floating hearts */}
        <AnimatedView
          style={[heart1Style, { left: '30%', top: '50%' }]}
          className="absolute"
        >
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
        <AnimatedView
          style={[heart2Style, { left: '50%', top: '50%' }]}
          className="absolute"
        >
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
        <AnimatedView
          style={[heart3Style, { left: '70%', top: '50%' }]}
          className="absolute"
        >
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
      </AnimatedView>
      
      <AnimatedView
        style={textStyle}
        className="flex flex-col items-center gap-3 max-w-sm text-center"
      >
        <div className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Loading your experience...
        </div>
        <p className="text-sm text-muted-foreground">
          Preparing amazing connections
        </p>
      </AnimatedView>
      
      <AnimatedView 
        style={dotsStyle}
        className="flex gap-2.5"
      >
        <AnimatedView
          style={dot1Style}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dot2Style}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dot3Style}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dot4Style}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
      </AnimatedView>
    </div>
  )
}
