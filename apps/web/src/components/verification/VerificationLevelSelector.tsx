import { motion, MotionView } from '@petspark/motion';
import { Shield, ShieldCheck, ShieldStar, Clock } from '@phosphor-icons/react';
import { VERIFICATION_REQUIREMENTS, type VerificationLevel } from '@/lib/verification-types';
import { cn } from '@/lib/utils';

interface VerificationLevelSelectorProps {
  selectedLevel: VerificationLevel;
  onSelectLevel: (level: VerificationLevel) => void;
}

export function VerificationLevelSelector({
  selectedLevel,
  onSelectLevel,
}: VerificationLevelSelectorProps) {
  const levels: { level: VerificationLevel; icon: typeof Shield; color: string; title: string }[] =
    [
      {
        level: 'basic',
        icon: Shield,
        color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        title: 'Basic',
      },
      {
        level: 'standard',
        icon: ShieldCheck,
        color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
        title: 'Standard',
      },
      {
        level: 'premium',
        icon: ShieldStar,
        color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
        title: 'Premium',
      },
    ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground">Select Verification Level</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {levels.map(({ level, icon: Icon, color, title }) => {
          const requirements = VERIFICATION_REQUIREMENTS[level];
          const isSelected = selectedLevel === level;

          return (
            <MotionView
              as="button"
              key={level}
              onClick={() => onSelectLevel(level)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all text-left',
                isSelected
                  ? `bg-gradient-to-br ${color}`
                  : 'bg-card border-border hover:border-primary/50'
              )}
            >
              {isSelected && (
                <MotionView
                  layoutId="selected-level"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn('p-2 rounded-lg', isSelected ? 'bg-primary/20' : 'bg-muted')}
                    >
                      <Icon
                        size={20}
                        weight="fill"
                        className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                      />
                    </div>
                    <h4 className={cn('font-bold text-lg', isSelected && 'text-primary')}>
                      {title}
                    </h4>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={14} />
                    <span>{requirements.estimatedReviewTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {requirements.requiredDocuments.length} required document
                    {requirements.requiredDocuments.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-md inline-block',
                    isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {requirements.benefits.length} benefits
                </div>
              </div>
            </MotionView>
          );
        })}
      </div>
    </div>
  );
}
