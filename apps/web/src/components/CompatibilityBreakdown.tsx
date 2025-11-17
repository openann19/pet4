'use client';

import { useEffect, useState } from 'react';
import { MotionView, MotionText } from '@petspark/motion';
import type { CompatibilityFactors } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CompatibilityBreakdownProps {
  factors: CompatibilityFactors;
  className?: string;
}

const FACTOR_KEYS = [
  'personalityMatch',
  'interestMatch',
  'sizeMatch',
  'ageCompatibility',
  'locationProximity',
] as const;

type FactorKey = (typeof FACTOR_KEYS)[number];

const factorLabels: Record<FactorKey, string> = {
  personalityMatch: 'Personality',
  interestMatch: 'Shared Interests',
  sizeMatch: 'Size Compatibility',
  ageCompatibility: 'Age Match',
  locationProximity: 'Location',
};

const factorIcons: Record<FactorKey, string> = {
  personalityMatch: '🎭',
  interestMatch: '🎾',
  sizeMatch: '📏',
  ageCompatibility: '🎂',
  locationProximity: '📍',
};

const factorColors: Record<FactorKey, string> = {
  personalityMatch: 'from-primary to-primary/60',
  interestMatch: 'from-accent to-accent/60',
  sizeMatch: 'from-secondary to-secondary/60',
  ageCompatibility: 'from-lavender to-lavender/60',
  locationProximity: 'from-primary to-accent',
};

type AnimatedValues = Partial<Record<FactorKey, number>>;

/**
 * Convert a raw compatibility value to a 0–100 percentage.
 * Assumption: factors are usually normalized 0–1, but we
 * accept 0–100 too and clamp either way.
 */
function toPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;

  // If it looks like 0–1, scale; if it's already >1, assume 0–100
  const scaled = value <= 1 ? value * 100 : value;
  const clamped = Math.min(100, Math.max(0, scaled));

  return Math.round(clamped);
}

export default function CompatibilityBreakdown({
  factors,
  className,
}: CompatibilityBreakdownProps) {
  const [animatedValues, setAnimatedValues] = useState<AnimatedValues>({});

  useEffect(() => {
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      const nextValues: AnimatedValues = {};

      for (const key of FACTOR_KEYS) {
        const raw = factors[key];
        nextValues[key] = toPercent(raw);
      }

      setAnimatedValues(nextValues);
    }, 100);

    return () => clearTimeout(timer);
  }, [factors]);

  return (
    <div
      className={cn(
        'rounded-3xl glass-strong premium-shadow backdrop-blur-2xl border border-white/20',
        'bg-gradient-to-br from-white/20 via-white/10 to-white/0',
        className,
      )}
      aria-label="Compatibility breakdown"
    >
      <div className="p-6">
        <MotionView
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"
        >
          <span className="inline-block" aria-hidden="true">
            📊
          </span>
          Compatibility Breakdown
        </MotionView>

        <div className="space-y-4">
          {FACTOR_KEYS.map((key, idx) => {
            const animatedPercentage = animatedValues[key] ?? 0;
            const label = factorLabels[key];
            const icon = factorIcons[key];
            const colorClass = factorColors[key];

            return (
              <MotionView
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: idx * 0.1,
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <MotionText
                      whileHover={{ scale: 1.3, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      aria-hidden="true"
                    >
                      {icon}
                    </MotionText>
                    <span>{label}</span>
                  </span>

                  <MotionText
                    className="text-sm font-bold tabular-nums text-muted-foreground"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 + 0.25 }}
                  >
                    {animatedPercentage}%
                  </MotionText>
                </div>

                <div className="relative">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <MotionView
                      className={cn(
                        'relative h-full overflow-hidden rounded-full bg-gradient-to-r',
                        colorClass,
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${animatedPercentage}%` }}
                      transition={{
                        delay: idx * 0.1 + 0.15,
                        duration: 0.8,
                        ease: 'easeOut',
                      }}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={animatedPercentage}
                      aria-label={`${label} compatibility ${animatedPercentage}%`}
                    >
                      <MotionView
                        className="absolute inset-0 bg-white/30"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'linear',
                          delay: idx * 0.1 + 0.3,
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
