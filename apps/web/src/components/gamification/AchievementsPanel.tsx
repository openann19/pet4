/**
 * AchievementsPanel Component
 *
 * Displays user achievements with progress tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { MotionView } from '@petspark/motion';
import { Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import type { Achievement } from '@petspark/core';
import { gamificationClient } from '@petspark/core';

interface AchievementsPanelProps {
  userId: string;
  className?: string;
}

export function AchievementsPanel({ userId, className }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await gamificationClient.getAchievements(userId);
        setAchievements(data);
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <PremiumCard className={className}>
        <div className="text-center py-8">Loading achievements...</div>
      </PremiumCard>
    );
  }

  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);

  return (
    <PremiumCard className={className}>
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h3 className="text-xl font-bold">Achievements</h3>
        <span className="text-sm text-muted-foreground">
          {unlocked.length} / {achievements.length}
        </span>
      </div>

      <div className="space-y-4">
        {unlocked.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} unlocked />
        ))}
        {locked.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} />
        ))}
      </div>
    </PremiumCard>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
}

function AchievementCard({ achievement, unlocked }: AchievementCardProps) {
  const progress = achievement.progress
    ? Math.round((achievement.progress / (achievement.maxProgress ?? 1)) * 100)
    : 0;

  return (
    <MotionView
      className={`p-4 rounded-xl border transition-all ${unlocked
          ? 'bg-linear-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
          : 'bg-muted/50 border-border opacity-60'
        }`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{achievement.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{achievement.name}</h4>
            {unlocked && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
          {!unlocked && achievement.maxProgress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-primary to-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
              {achievement.points} pts
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {achievement.rarity}
            </span>
          </div>
        </div>
        {!unlocked && <Lock className="w-5 h-5 text-muted-foreground" />}
      </div>
    </MotionView>
  );
}
