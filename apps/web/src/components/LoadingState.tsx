// apps/web/src/components/LoadingState.tsx
import { PawPrint, Heart } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';

export default function LoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-4">
      <LoadingSpinner />
      <LoadingText />
      <LoadingDots />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <MotionView
      className="relative h-28 w-28"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Outer glow ring */}
      <MotionView
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30"
        initial={{ scale: 1, opacity: 0.4, rotate: 0 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4], rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Middle glow ring */}
      <MotionView
        className="absolute inset-2 rounded-full bg-gradient-to-tr from-accent/30 to-primary/30"
        initial={{ scale: 1, opacity: 0.3, rotate: 0 }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3], rotate: -360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center icon container */}
      <MotionView
        className="absolute inset-4 flex items-center justify-center rounded-full border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <MotionView
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <PawPrint size={40} weight="fill" className="text-primary drop-shadow-lg" />
        </MotionView>
      </MotionView>

      {/* Floating hearts */}
      <FloatingHeart offsetClass="left-[30%]" delay={0} />
      <FloatingHeart offsetClass="left-1/2" delay={0.3} />
      <FloatingHeart offsetClass="left-[70%]" delay={0.6} />
    </MotionView>
  );
}

interface FloatingHeartProps {
  offsetClass: string;
  delay: number;
}

function FloatingHeart({ offsetClass, delay }: FloatingHeartProps) {
  return (
    <MotionView
      className={`absolute top-1/2 ${offsetClass}`}
      initial={{ y: 0, scale: 0.7, opacity: 0 }}
      animate={{ y: [-8, -24, -8], scale: [0.7, 1, 0.7], opacity: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <Heart size={16} weight="fill" className="text-accent" />
    </MotionView>
  );
}

function LoadingText() {
  return (
    <MotionView
      className="flex max-w-sm flex-col items-center gap-3 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
    >
      <div className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-xl font-bold text-transparent">
        Loading your experience...
      </div>
      <p className="text-sm text-muted-foreground">Preparing amazing connections</p>
    </MotionView>
  );
}

function LoadingDots() {
  const baseTransition = {
    duration: 1.2,
    repeat: Infinity,
    ease: 'easeInOut',
  } as const;

  const delays = [0, 0.18, 0.36, 0.54];

  return (
    <MotionView
      className="flex gap-2.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
    >
      {delays.map((delay) => (
        <MotionView
          key={delay}
          className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ ...baseTransition, delay }}
        />
      ))}
    </MotionView>
  );
}
