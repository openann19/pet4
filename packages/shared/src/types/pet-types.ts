export interface TrustBadge {
  id: string;
  type: 'verified_owner' | 'vaccinated' | 'health_certified' | 'background_check' | 'experienced_owner' | 'trainer_approved' | 'rescue_supporter' | 'community_favorite' | 'active_member' | 'top_rated';
  label: string;
  description: string;
  earnedAt: string;
  icon?: string;
}

export interface Rating {
  id: string;
  petId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  helpful: number;
  category: 'playdate' | 'behavior' | 'temperament' | 'owner_communication' | 'general';
  createdAt: string;
}

export interface PetTrustProfile {
  overallRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  badges: TrustBadge[];
  playdateCount: number;
  responseRate: number;
  responseTime: string;
  trustScore: number;
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  photo: string;
  photos: string[];
  bio: string;
  personality: string[];
  interests: string[];
  lookingFor: string[];
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  verified: boolean;
  createdAt: string;
  trustProfile?: PetTrustProfile;
  ratings?: Rating[];
  trustScore?: number;
  badges?: TrustBadge[];
  activityLevel?: 'low' | 'moderate' | 'high' | 'very-high';
  playdateCount?: number;
  overallRating?: number;
  responseRate?: number;
}
