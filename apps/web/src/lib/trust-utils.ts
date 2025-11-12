import type { TrustBadge, Rating, PetTrustProfile } from './types';

export function generateTrustBadges(petId: string, verified: boolean): TrustBadge[] {
  const badges: TrustBadge[] = [];
  const now = new Date().toISOString();

  if (isTruthy(verified)) {
    badges.push({
      id: `${String(petId ?? '')}-verified`,
      type: 'verified_owner',
      label: 'Verified Owner',
      description: 'Owner identity has been verified through official documentation',
      earnedAt: now,
    });
  }

  const possibleBadges: Omit<TrustBadge, 'id' | 'earnedAt'>[] = [
    {
      type: 'vaccinated',
      label: 'Up-to-Date Vaccinations',
      description: 'All vaccinations are current and verified by a licensed veterinarian',
    },
    {
      type: 'health_certified',
      label: 'Health Certified',
      description: 'Recent health check-up completed with clean bill of health',
    },
    {
      type: 'background_check',
      label: 'Background Verified',
      description: 'Owner has passed comprehensive background screening',
    },
    {
      type: 'experienced_owner',
      label: 'Experienced Owner',
      description: 'Owner has 5+ years of pet care experience',
    },
    {
      type: 'trainer_approved',
      label: 'Professional Training',
      description: 'Completed professional obedience training program',
    },
    {
      type: 'rescue_supporter',
      label: 'Rescue Supporter',
      description: 'Active supporter of animal rescue organizations',
    },
    {
      type: 'community_favorite',
      label: 'Community Favorite',
      description: 'Highly rated by the PawfectMatch community',
    },
    {
      type: 'active_member',
      label: 'Active Member',
      description: 'Regular participant with consistent engagement',
    },
    {
      type: 'top_rated',
      label: 'Top Rated',
      description: 'Maintains a 4.8+ average rating across all reviews',
    },
  ];

  const numBadges = Math.floor(Math.random() * 5) + 2;
  const selectedBadges = possibleBadges.sort(() => Math.random() - 0.5).slice(0, numBadges);

  selectedBadges.forEach((badge) => {
    badges.push({
      ...badge,
      id: `${String(petId ?? '')}-${String(badge.type ?? '')}`,
      earnedAt: now,
    });
  });

  return badges;
}

export function generateRatings(petId: string, count = 5): Rating[] {
  const ratings: Rating[] = [];
  const reviewerNames = [
    'Sarah Johnson',
    'Michael Chen',
    'Emma Wilson',
    'David Martinez',
    'Olivia Brown',
    'James Taylor',
    'Sophia Anderson',
    'Liam Thompson',
    'Isabella Garcia',
    'Noah Rodriguez',
  ];

  const comments = [
    'Amazing playdate experience! Our pets got along wonderfully.',
    'Very responsible owner. Great communication throughout.',
    'Highly recommend! The pet was well-behaved and friendly.',
    'Perfect match for our furry friend. Would definitely meet again!',
    'Owner was punctual and attentive. Great overall experience.',
    'Our pets had such a great time together. Looking forward to the next playdate!',
    'Exceptional temperament and very well-trained.',
    'Smooth coordination and wonderful interaction between our pets.',
    'Professional and caring owner. Felt very comfortable.',
    'Best playdate yet! Both pets were happy and safe.',
  ];

  const categories: (
    | 'playdate'
    | 'behavior'
    | 'temperament'
    | 'owner_communication'
    | 'general'
  )[] = ['playdate', 'behavior', 'temperament', 'owner_communication', 'general'];

  for (let i = 0; i < count; i++) {
    const rating =
      Math.random() > 0.3 ? (Math.random() > 0.5 ? 5 : 4) : Math.floor(Math.random() * 3) + 3;
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    const reviewerName = reviewerNames[i % reviewerNames.length];
    const comment = comments[i % comments.length];
    const category = categories[Math.floor(Math.random() * categories.length)];

    if (!reviewerName || !comment || !category) {
      continue;
    }

    ratings.push({
      id: `rating-${String(petId ?? '')}-${String(i ?? '')}`,
      petId,
      reviewerId: `reviewer-${String(i ?? '')}`,
      reviewerName,
      reviewerAvatar: `https://i.pravatar.cc/150?img=${String((i % 70) + 1 ?? '')}`,
      rating,
      comment,
      helpful: Math.floor(Math.random() * 15),
      category,
      createdAt,
    });
  }

  return ratings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function calculateTrustProfile(
  ratings: Rating[],
  badges: TrustBadge[],
  playdateCount?: number
): PetTrustProfile {
  const totalReviews = ratings.length;

  if (totalReviews === 0) {
    return {
      overallRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      badges,
      playdateCount: playdateCount ?? 0,
      responseRate: 100,
      responseTime: '<1h',
      trustScore: (badges && Array.isArray(badges) ? badges.length : 0) * 10,
    };
  }

  const ratingBreakdown = {
    5: ratings.filter((r) => r.rating === 5).length,
    4: ratings.filter((r) => r.rating === 4).length,
    3: ratings.filter((r) => r.rating === 3).length,
    2: ratings.filter((r) => r.rating === 2).length,
    1: ratings.filter((r) => r.rating === 1).length,
  };

  const overallRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  const responseRate = Math.floor(Math.random() * 15) + 85;
  const responseTimeOptions = ['<1h', '~2h', '~4h', 'within 24h'];
  const responseTime =
    responseTimeOptions[Math.floor(Math.random() * responseTimeOptions.length)] ?? '<1h';

  const trustScore = Math.min(
    100,
    Math.round(
      overallRating * 15 +
        (badges && Array.isArray(badges) ? badges.length : 0) * 8 +
        (playdateCount ?? 0) * 2 +
        responseRate * 0.3
    )
  );

  return {
    overallRating: Math.round(overallRating * 10) / 10,
    totalReviews,
    ratingBreakdown,
    badges,
    playdateCount: playdateCount ?? Math.floor(Math.random() * 20) + 5,
    responseRate,
    responseTime,
    trustScore,
  };
}
