import { motion } from '@petspark/motion'
import { PawPrint, Heart } from '@phosphor-icons/react'

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
      <MotionView
        className="relative w-28 h-28"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Outer glow ring */}
        <MotionView
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.4, 0, 0.4],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Middle glow ring */}
        <MotionView
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-accent/30 to-primary/30"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
        />
        
        {/* Center icon container */}
        <MotionView
          className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <MotionView
            animate={{
              rotate: [0, -360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <PawPrint size={40} weight="fill" className="text-primary drop-shadow-lg" />
          </MotionView>
        </MotionView>

        {/* Floating hearts */}
        {[0, 1, 2].map((i) => (
          <MotionView
            key={i}
            className="absolute"
            style={{
              left: `${30 + i * 20}%`,
              top: '50%',
            }}
            animate={{
              y: [-20, -40, -20],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          >
            <Heart size={16} weight="fill" className="text-accent" />
          </MotionView>
        ))}
      </MotionView>
      
      <MotionView
        className="flex flex-col items-center gap-3 max-w-sm text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <MotionView 
          className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"
        >
          Loading your experience...
        </MotionView>
        <p className="text-sm text-muted-foreground">
          Preparing amazing connections
        </p>
      </MotionView>
      
      <MotionView 
        className="flex gap-2.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2, 3].map((i) => (
          <MotionView
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </MotionView>
    </div>
  )
}
