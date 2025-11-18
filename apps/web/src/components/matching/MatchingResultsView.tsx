/**
 * MatchingResultsView Component
 *
 * Displays AI-powered matching results with explanations
 */

'use client';

import { useState } from 'react';
import { MotionView } from '@petspark/motion';
import { Sparkles, TrendingUp, Info, ChevronRight } from 'lucide-react';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { Button } from '@/components/ui/button';
import type { Pet } from '@/lib/types';

export interface MatchResult {
  pet: Pet;
  compatibilityScore: number;
  explanation: MatchExplanation;
  behavioralPatterns: BehavioralPattern[];
  personalityAnalysis: PersonalityAnalysis;
  photoAnalysis?: PhotoAnalysis;
}

export interface MatchExplanation {
  summary: string;
  strengths: string[];
  considerations: string[];
  aiInsights: string[];
}

export interface BehavioralPattern {
  pattern: string;
  confidence: number;
  description: string;
}

export interface PersonalityAnalysis {
  traits: { trait: string; score: number }[];
  compatibility: number;
  notes: string;
}

export interface PhotoAnalysis {
  quality: number;
  authenticity: number;
  petCharacteristics: string[];
}

interface MatchingResultsViewProps {
  userPet: Pet;
  matches: MatchResult[];
  onMatchSelect?: (match: MatchResult) => void;
  className?: string;
}

export function MatchingResultsView({
  userPet,
  matches,
  onMatchSelect,
  className,
}: MatchingResultsViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleMatchClick = (match: MatchResult) => {
    setSelectedMatch(match);
    setShowExplanation(true);
    onMatchSelect?.(match);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">AI-Powered Matches</h2>
        <span className="text-sm text-muted-foreground">({matches.length} results)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match, idx) => (
          <MatchCard
            key={match.pet.id}
            match={match}
            index={idx}
            onClick={() => handleMatchClick(match)}
          />
        ))}
      </div>

      {selectedMatch && showExplanation && (
        <MatchExplanationDialog
          match={selectedMatch}
          userPet={userPet}
          onClose={() => setShowExplanation(false)}
        />
      )}
    </div>
  );
}

interface MatchCardProps {
  match: MatchResult;
  index: number;
  onClick: () => void;
}

function MatchCard({ match, index, onClick }: MatchCardProps) {
  return (
    <MotionView
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="cursor-pointer"
      onClick={() => void onClick()}
    >
      <PremiumCard className="h-full">
        <div className="relative">
          {match.pet.photos?.[0] && (
            <img
              src={match.pet.photos[0]}
              alt={match.pet.name}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
          )}
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1 rounded-full bg-background/90 backdrop-blur-sm border border-primary/30">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">
                  {match.compatibilityScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-1">{match.pet.name}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {match.pet.age} years • {match.pet.size}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Info className="w-3 h-3" />
            <span>{match.explanation.summary}</span>
          </div>

          <Button variant="outline" size="sm" className="w-full">
            View Details
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </PremiumCard>
    </MotionView>
  );
}

interface MatchExplanationDialogProps {
  match: MatchResult;
  userPet: Pet;
  onClose: () => void;
}

function MatchExplanationDialog({ match, userPet: _userPet, onClose }: MatchExplanationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <MotionView
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <PremiumCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Match Explanation</h2>
            <Button variant="ghost" size="sm" onClick={() => void onClose()}>
              Close
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Compatibility Score</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                {match.compatibilityScore}%
              </div>
              <p className="text-sm text-muted-foreground">{match.explanation.summary}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Strengths</h3>
              <ul className="space-y-2">
                {match.explanation.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {match.explanation.considerations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Considerations</h3>
                <ul className="space-y-2">
                  {match.explanation.considerations.map((consideration, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">⚠</span>
                      <span>{consideration}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-3">AI Insights</h3>
              <div className="space-y-2">
                {match.explanation.aiInsights.map((insight, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {match.personalityAnalysis && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Personality Analysis</h3>
                <div className="space-y-2">
                  {match.personalityAnalysis.traits.map((trait, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{trait.trait}</span>
                      <div className="flex-1 mx-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-accent"
                          style={{ width: `${Math.min(100, Math.max(0, trait.score))}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{trait.score}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {match.personalityAnalysis.notes}
                </p>
              </div>
            )}

            {match.behavioralPatterns.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Behavioral Patterns</h3>
                <div className="space-y-3">
                  {match.behavioralPatterns.map((pattern, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{pattern.pattern}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(pattern.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PremiumCard>
      </MotionView>
    </div>
  );
}

