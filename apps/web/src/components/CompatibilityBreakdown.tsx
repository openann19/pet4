import { MotionView, MotionText } from '@petspark/motion';
import type { CompatibilityFactors } from '@/lib/types';
import { useEffect, useState } from 'react';

interface CompatibilityBreakdownProps {
  factors: CompatibilityFactors;
  className?: string;
}

const factorLabels = {
  personalityMatch: 'Personality',
  interestMatch: 'Shared Interests',
  sizeMatch: 'Size Compatibility',
  ageCompatibility: 'Age Match',
  locationProximity: 'Location',
};

const factorIcons = {
  personalityMatch: '🎭',
  interestMatch: '🎾',
  sizeMatch: '📏',
  ageCompatibility: '🎂',
  locationProximity: '📍',
};

const factorColors = {
  personalityMatch: 'from-primary to-primary/60',
  interestMatch: 'from-accent to-accent/60',
  sizeMatch: 'from-secondary to-secondary/60',
  ageCompatibility: 'from-lavender to-lavender/60',
  locationProximity: 'from-primary to-accent',
};

export default function CompatibilityBreakdown({
  factors,
  className,
}: CompatibilityBreakdownProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      const values: Record<string, number> = {
        personalityMatch: factors.personalityMatch,
        interestMatch: factors.interestMatch,
        sizeMatch: factors.sizeMatch,
        ageCompatibility: factors.ageCompatibility,
        locationProximity: factors.locationProximity,
      };
      setAnimatedValues(values);
    }, 100);
    return () => clearTimeout(timer);
  }, [factors]);

  return (
    <div
      className={`rounded-3xl glass-strong premium-shadow backdrop-blur-2xl border border-white/20 ${className}`}
    >
      <div className="p-6 bg-linear-to-br from-white/20 to-white/10">
        <MotionView
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold mb-4 flex items-center gap-2 bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"
        >
          <MotionText
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            📊
          </MotionText>
          Compatibility Breakdown
        </MotionView>
        <div className="space-y-4">
          {Object.entries(factors).map(([key, _value], idx) => {
            const animatedPercentage = Math.round((animatedValues[key] || 0) * 100);
            const label = factorLabels[key as keyof typeof factorLabels];
            const icon = factorIcons[key as keyof typeof factorIcons];
            const colorClass = factorColors[key as keyof typeof factorColors];

            return (
              <MotionView
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <MotionText
                      whileHover={{ scale: 1.3, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {icon}
                    </MotionText>
                    {label}
                  </span>
                  <MotionText
                    className="text-sm font-bold text-muted-foreground tabular-nums"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    {animatedPercentage}%
                  </MotionText>
                </div>
                <div className="relative">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <MotionView
                      className={`h-full bg-linear-to-r ${colorClass} rounded-full relative overflow-hidden`}
                      initial={{ width: 0 }}
                      animate={{ width: `${animatedPercentage}%` }}
                      transition={{ delay: idx * 0.1 + 0.2, duration: 0.8, ease: 'easeOut' }}
                    >
                      <MotionView
                        className="absolute inset-0 bg-white/30"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'linear',
                          delay: idx * 0.1 + 0.5,
                        }}
                        style={{ width: '50%' }}
                      />
                    </MotionView>
                  </div>
                </div>
              </MotionView>
            );
          })}
        </div>
      </div>
    </div>
  );
}
