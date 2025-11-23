/**
 * ChallengesPanel Component
 *
 * Displays active challenges and progress
 */

'use client';

import { useState, useEffect } from 'react';
import { MotionView } from '@petspark/motion';
import { Target, Clock, Gift } from 'lucide-react';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import type { Challenge, ChallengeProgress } from '@petspark/core';
import { gamificationClient } from '@petspark/core';

interface ChallengesPanelProps {
  userId: string;
  className?: string;
}

export function ChallengesPanel({ userId, className }: ChallengesPanelProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await gamificationClient.getChallenges(userId);
        setChallenges(data.filter((c) => c.status === 'active'));
      } catch (error) {
        console.error('Failed to load challenges:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <PremiumCard className={className}>
        <div className="text-center py-8">Loading challenges...</div>
      </PremiumCard>
    );
  }

  if (challenges.length === 0) {
    return (
      <PremiumCard className={className}>
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No active challenges</p>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className={className}>
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold">Active Challenges</h3>
      </div>

      <div className="space-y-4">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} userId={userId} />
        ))}
      </div>
    </PremiumCard>
  );
}

interface ChallengeCardProps {
  challenge: Challenge;
  userId: string;
}

function ChallengeCard({ challenge, userId }: ChallengeCardProps) {
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await gamificationClient.getChallengeProgress(userId, challenge.id);
        setProgress(data);
      } catch (error) {
        console.error('Failed to load challenge progress:', error);
      }
    })();
  }, [challenge.id, userId]);

  const endDate = new Date(challenge.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <MotionView
      className="p-4 rounded-xl border bg-linear-to-br from-primary/5 to-accent/5 border-primary/20"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold mb-1">{challenge.name}</h4>
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{daysLeft}d left</span>
        </div>
      </div>

      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-2">
            <span>Progress</span>
            <span>{Math.round(progress.overallProgress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary to-accent transition-all"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        {challenge.rewards.map((reward, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/20 text-primary"
          >
            <Gift className="w-3 h-3" />
            <span>
              {reward.type === 'points' && `${reward.value} pts`}
              {reward.type === 'badge' && `Badge: ${reward.value}`}
              {reward.type === 'premium_days' && `${reward.value} days`}
            </span>
          </div>
        ))}
      </div>
    </MotionView>
  );
}
