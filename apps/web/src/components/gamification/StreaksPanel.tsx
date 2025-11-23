/**
 * StreaksPanel Component
 *
 * Displays login and activity streaks
 */

'use client';

import { useState, useEffect } from 'react';
import { MotionView } from '@petspark/motion';
import { Flame, TrendingUp } from 'lucide-react';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import type { Streak } from '@petspark/core';
import { gamificationClient, getStreakEmoji } from '@petspark/core';

interface StreaksPanelProps {
  userId: string;
  className?: string;
}

export function StreaksPanel({ userId, className }: StreaksPanelProps) {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await gamificationClient.getStreaks(userId);
        setStreaks(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to load streaks:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <PremiumCard className={className}>
        <div className="text-center py-8">Loading streaks...</div>
      </PremiumCard>
    );
  }

  const loginStreak = streaks.find((s) => s.type === 'login');

  return (
    <PremiumCard className={className}>
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-6 h-6 text-orange-500" />
        <h3 className="text-xl font-bold">Streaks</h3>
      </div>

      {loginStreak && (
        <div className="space-y-4">
          <StreakCard streak={loginStreak} />
          {streaks
            .filter((s) => s.type !== 'login')
            .map((streak) => (
              <StreakCard key={streak.type} streak={streak} />
            ))}
        </div>
      )}

      {!loginStreak && (
        <div className="text-center py-8 text-muted-foreground">
          <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Start your streak today!</p>
        </div>
      )}
    </PremiumCard>
  );
}

interface StreakCardProps {
  streak: Streak;
}

function StreakCard({ streak }: StreakCardProps) {
  const emoji = getStreakEmoji(streak);
  const typeLabels: Record<string, string> = {
    login: 'Login Streak',
    messaging: 'Messaging Streak',
    playdates: 'Playdates Streak',
    profile_updates: 'Profile Updates Streak',
  };

  const streakType = streak.type;

  return (
    <MotionView
      className="p-4 rounded-xl border bg-linear-to-br from-orange-500/10 to-red-500/10 border-orange-500/30"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{emoji}</div>
          <div>
            <h4 className="font-semibold">{typeLabels[streakType] ?? streakType}</h4>
            <p className="text-sm text-muted-foreground">
              {streak.current} day{streak.current !== 1 ? 's' : ''} in a row
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>Best: {streak.longest}</span>
          </div>
          {streak.nextMilestone !== undefined && (
            <div className="text-xs text-muted-foreground mt-1">
              Next: {streak.nextMilestone} days
            </div>
          )}
        </div>
      </div>
    </MotionView>
  );
}
