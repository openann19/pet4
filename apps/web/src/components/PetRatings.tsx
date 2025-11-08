import { useState } from 'react';
import { Star, ThumbsUp, User } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { Rating, PetTrustProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface PetRatingsProps {
  trustProfile: PetTrustProfile;
  ratings?: Rating[];
  compact?: boolean;
}

export function PetRatings({ trustProfile, ratings = [], compact = false }: PetRatingsProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);

  const displayedReviews = showAllReviews ? ratings : ratings.slice(0, 3);
  const totalRatings = Object.values(trustProfile.ratingBreakdown).reduce(
    (sum, count) => sum + count,
    0
  );

  const getRatingPercentage = (star: number) => {
    if (totalRatings === 0) return 0;
    return Math.round(
      (trustProfile.ratingBreakdown[star as 5 | 4 | 3 | 2 | 1] / totalRatings) * 100
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-1">
          <Star size={18} weight="fill" className="text-yellow-500" />
          <span className="text-lg font-bold text-foreground">
            {trustProfile.overallRating.toFixed(1)}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          ({trustProfile.totalReviews} {trustProfile.totalReviews === 1 ? 'review' : 'reviews'})
        </span>
        {trustProfile.trustScore >= 90 && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Highly Trusted
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50 shadow-lg">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5 pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-bold">Ratings & Reviews</span>
          {trustProfile.trustScore >= 90 && (
            <Badge className="bg-primary text-primary-foreground">Highly Trusted</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="text-5xl font-bold text-foreground">
              {trustProfile.overallRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  weight={star <= Math.round(trustProfile.overallRating) ? 'fill' : 'regular'}
                  className={cn(
                    star <= Math.round(trustProfile.overallRating)
                      ? 'text-yellow-500'
                      : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on {trustProfile.totalReviews}{' '}
              {trustProfile.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium text-foreground">{star}</span>
                  <Star size={14} weight="fill" className="text-yellow-500" />
                </div>
                <Progress value={getRatingPercentage(star)} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {getRatingPercentage(star)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-primary">{trustProfile.playdateCount}</div>
            <div className="text-xs text-muted-foreground">Playdates</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-primary">{trustProfile.responseRate}%</div>
            <div className="text-xs text-muted-foreground">Response Rate</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-primary">{trustProfile.responseTime}</div>
            <div className="text-xs text-muted-foreground">Avg. Response</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-primary">{trustProfile.trustScore}</div>
            <div className="text-xs text-muted-foreground">Trust Score</div>
          </div>
        </div>

        {ratings.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Recent Reviews</h3>
              {displayedReviews.map((rating) => (
                <div
                  key={rating.id}
                  className="space-y-3 pb-4 border-b border-border/30 last:border-0 last:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-10 h-10 border-2 border-border">
                        <AvatarImage src={rating.reviewerAvatar} alt={rating.reviewerName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User size={20} weight="bold" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {rating.reviewerName}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {rating.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              weight={star <= rating.rating ? 'fill' : 'regular'}
                              className={cn(
                                star <= rating.rating
                                  ? 'text-yellow-500'
                                  : 'text-muted-foreground/30'
                              )}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed pl-[52px]">
                      {rating.comment}
                    </p>
                  )}
                  {rating.helpful > 0 && (
                    <div className="flex items-center gap-2 pl-[52px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <ThumbsUp size={14} />
                        Helpful ({rating.helpful})
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {ratings.length > 3 && !showAllReviews && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllReviews(true)}
                >
                  Show All {ratings.length} Reviews
                </Button>
              )}
              {showAllReviews && ratings.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllReviews(false)}
                >
                  Show Less
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PetRatings;
