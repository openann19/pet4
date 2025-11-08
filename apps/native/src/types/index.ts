export interface TrustBadge {
  id: string;
  type:
    | 'verified_owner'
    | 'vaccinated'
    | 'health_certified'
    | 'background_check'
    | 'experienced_owner'
    | 'trainer_approved'
    | 'rescue_supporter'
    | 'community_favorite'
    | 'active_member'
    | 'top_rated';
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

export interface Match {
  id: string;
  petId: string;
  matchedPetId: string;
  matchedPetName?: string;
  matchedPetPhoto?: string;
  compatibilityScore: number;
  reasoning: string[];
  matchedAt: string;
  status: 'active' | 'archived';
}

export interface SwipeAction {
  petId: string;
  targetPetId: string;
  action: 'like' | 'pass' | 'superlike';
  timestamp: string;
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'location' | 'sticker' | 'voice';
  reactions?: Reaction[];
  locationData?: LocationData;
  voiceDuration?: number;
}

export interface ChatRoom {
  id: string;
  matchId: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  petName: string;
  petPhoto: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  type: 'text' | 'photo' | 'event' | 'question';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location: string;
  pets: string[];
  createdAt: string;
  bio?: string;
}

export interface AdoptionListing {
  id: string;
  petName: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  photo: string;
  photos: string[];
  description: string;
  location: string;
  fee: number;
  contactInfo: string;
  organizationId: string;
  organizationName: string;
  status: 'available' | 'pending' | 'adopted';
  createdAt: string;
}

export interface LostPetReport {
  id: string;
  petName: string;
  breed: string;
  photo: string;
  description: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  contactInfo: string;
  reporterId: string;
  reporterName: string;
  status: 'lost' | 'found' | 'reunited';
  createdAt: string;
}
