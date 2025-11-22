 
import type { Pet } from './types';

export type PetType = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'other';

export interface PetProfileTemplate {
  id: string;
  name: string;
  type: PetType;
  description: string;
  emoji: string;
  defaults: {
    breed?: string;
    size?: 'small' | 'medium' | 'large' | 'extra-large';
    personality: string[];
    interests: string[];
    lookingFor: string[];
    bio?: string;
    activityLevel?: 'low' | 'moderate' | 'high' | 'very-high';
  };
}

export const PET_PROFILE_TEMPLATES: PetProfileTemplate[] = [
  {
    id: 'energetic-dog',
    name: 'Energetic Dog',
    type: 'dog',
    description: 'Perfect for active dogs who love running, playing, and outdoor adventures',
    emoji: '🐕‍🦺',
    defaults: {
      size: 'medium',
      activityLevel: 'very-high',
      personality: ['Energetic', 'Playful', 'Social', 'Friendly', 'Loyal'],
      interests: ['Running', 'Fetch', 'Hiking', 'Parks', 'Swimming', 'Agility'],
      lookingFor: ['Playdate', 'Running Buddy', 'Adventure Buddy', 'Park Companion'],
      bio: 'Full of energy and always ready for adventure! Loves outdoor activities and making new friends at the park.',
    },
  },
  {
    id: 'calm-dog',
    name: 'Calm Companion Dog',
    type: 'dog',
    description: 'Ideal for gentle, relaxed dogs who prefer quiet companionship',
    emoji: '🐶',
    defaults: {
      size: 'medium',
      activityLevel: 'moderate',
      personality: ['Calm', 'Gentle', 'Affectionate', 'Loyal', 'Friendly'],
      interests: ['Cuddling', 'Treats', 'Toys', 'Car Rides', 'Beach'],
      lookingFor: ['Cuddle Buddy', 'Walking Buddy', 'Best Friend'],
      bio: 'A gentle soul who loves calm walks, cozy cuddles, and quiet time with friends. Perfect for relaxed playdates.',
    },
  },
  {
    id: 'social-dog',
    name: 'Social Butterfly Dog',
    type: 'dog',
    description: 'For dogs who love meeting new friends and group activities',
    emoji: '🦮',
    defaults: {
      size: 'medium',
      activityLevel: 'high',
      personality: ['Social', 'Friendly', 'Playful', 'Energetic', 'Affectionate'],
      interests: ['Parks', 'Playdate', 'Fetch', 'Training', 'Treats', 'Toys'],
      lookingFor: ['Best Friend', 'Playdate', 'Park Companion', 'Walking Buddy'],
      bio: 'Loves making new friends and never meets a stranger! Always excited for group play and social activities.',
    },
  },
  {
    id: 'small-lap-dog',
    name: 'Lap Dog',
    type: 'dog',
    description: 'Small breeds who love cuddles and close companionship',
    emoji: '🐕',
    defaults: {
      size: 'small',
      activityLevel: 'low',
      personality: ['Affectionate', 'Gentle', 'Calm', 'Loyal', 'Social'],
      interests: ['Cuddling', 'Toys', 'Treats', 'Car Rides', 'Parks'],
      lookingFor: ['Cuddle Buddy', 'Best Friend', 'Playmate'],
      bio: 'Small but mighty! Loves being close to loved ones and enjoys gentle play with friends.',
    },
  },
  {
    id: 'working-dog',
    name: 'Working Dog',
    type: 'dog',
    description: 'Intelligent, trainable dogs who love having a job to do',
    emoji: '🐕‍🦺',
    defaults: {
      size: 'large',
      activityLevel: 'very-high',
      personality: ['Loyal', 'Protective', 'Social', 'Energetic', 'Friendly'],
      interests: ['Training', 'Agility', 'Running', 'Fetch', 'Hiking', 'Swimming'],
      lookingFor: ['Training Partner', 'Adventure Buddy', 'Best Friend'],
      bio: 'Smart, driven, and always ready for training sessions or outdoor challenges. Looking for equally motivated companions.',
    },
  },
  {
    id: 'playful-cat',
    name: 'Playful Cat',
    type: 'cat',
    description: 'Active cats who love toys, climbing, and interactive play',
    emoji: '🐱',
    defaults: {
      size: 'small',
      activityLevel: 'high',
      personality: ['Playful', 'Curious', 'Energetic', 'Social', 'Affectionate'],
      interests: ['Toys', 'Climbing', 'Laser Pointer', 'Hunting', 'Catnip', 'Playing'],
      lookingFor: ['Playmate', 'Play Partner', 'Friend'],
      bio: 'Always up for a good play session! Loves chasing toys, climbing adventures, and interactive games.',
    },
  },
  {
    id: 'lap-cat',
    name: 'Lap Cat',
    type: 'cat',
    description: 'Affectionate cats who love cuddles and close companionship',
    emoji: '😺',
    defaults: {
      size: 'small',
      activityLevel: 'low',
      personality: ['Affectionate', 'Calm', 'Gentle', 'Lap Cat', 'Social'],
      interests: ['Cuddling', 'Napping', 'Windows', 'Treats', 'Scratching'],
      lookingFor: ['Cuddle Buddy', 'Nap Companion', 'Friend'],
      bio: 'The ultimate cuddle companion. Loves cozy naps, gentle pets, and quiet companionship.',
    },
  },
  {
    id: 'independent-cat',
    name: 'Independent Cat',
    type: 'cat',
    description: 'Self-sufficient cats who enjoy their own space',
    emoji: '🐈',
    defaults: {
      size: 'medium',
      activityLevel: 'moderate',
      personality: ['Independent', 'Calm', 'Curious', 'Gentle', 'Playful'],
      interests: ['Windows', 'Exploring', 'Hunting', 'Treats', 'Toys'],
      lookingFor: ['Friend', 'Window Watching Friend', 'Playmate'],
      bio: 'Values independence but enjoys occasional companionship. Perfect for friends who respect boundaries.',
    },
  },
  {
    id: 'curious-cat',
    name: 'Curious Explorer Cat',
    type: 'cat',
    description: 'Adventurous cats who love exploring and discovering',
    emoji: '🐈‍⬛',
    defaults: {
      size: 'medium',
      activityLevel: 'high',
      personality: ['Curious', 'Adventurous', 'Playful', 'Social', 'Independent'],
      interests: ['Exploring', 'Climbing', 'Hunting', 'Toys', 'Playing', 'Windows'],
      lookingFor: ['Friend', 'Play Partner', 'Playmate'],
      bio: 'Always on an adventure! Loves exploring new places and discovering hidden treasures around the house.',
    },
  },
  {
    id: 'social-bird',
    name: 'Social Bird',
    type: 'bird',
    description: 'Friendly birds who love interaction and companionship',
    emoji: '🦜',
    defaults: {
      size: 'small',
      activityLevel: 'high',
      personality: ['Social', 'Vocal', 'Playful', 'Friendly', 'Interactive'],
      interests: ['Singing', 'Talking', 'Social Time', 'Toys', 'Playing', 'Training'],
      lookingFor: ['Cage Mate', 'Singing Partner', 'Friend', 'Flock Member'],
      bio: 'Loves to chat and sing! Always happy to have company and enjoys interactive play.',
    },
  },
  {
    id: 'singing-bird',
    name: 'Singing Bird',
    type: 'bird',
    description: 'Musical birds who love to vocalize and perform',
    emoji: '🐦',
    defaults: {
      size: 'small',
      activityLevel: 'moderate',
      personality: ['Vocal', 'Musical', 'Social', 'Playful', 'Friendly'],
      interests: ['Singing', 'Music', 'Talking', 'Social Time', 'Perching', 'Treats'],
      lookingFor: ['Singing Partner', 'Friend', 'Social Buddy'],
      bio: 'A natural performer who loves to sing and vocalize. Looking for a duet partner!',
    },
  },
  {
    id: 'calm-bird',
    name: 'Calm Companion Bird',
    type: 'bird',
    description: 'Gentle, quiet birds who prefer peaceful environments',
    emoji: '🕊️',
    defaults: {
      size: 'small',
      activityLevel: 'low',
      personality: ['Calm', 'Gentle', 'Affectionate', 'Independent', 'Friendly'],
      interests: ['Perching', 'Treats', 'Social Time', 'Foraging', 'Toys'],
      lookingFor: ['Friend', 'Peaceful Companion', 'Cage Mate'],
      bio: 'Enjoys a peaceful environment and gentle companionship. Perfect for quiet, relaxed interactions.',
    },
  },
  {
    id: 'bonded-rabbit',
    name: 'Bonded Pair Rabbit',
    type: 'rabbit',
    description: 'Rabbits seeking a lifelong companion',
    emoji: '🐰',
    defaults: {
      size: 'small',
      activityLevel: 'moderate',
      personality: ['Social', 'Affectionate', 'Playful', 'Gentle', 'Cuddly'],
      interests: ['Hopping', 'Treats', 'Toys', 'Cuddling', 'Garden Time', 'Grooming'],
      lookingFor: ['Bonded Pair', 'Cuddle Buddy', 'Friend', 'Warren Mate'],
      bio: 'Looking for a special bunny to bond with for life. Loves cuddles and spending time together.',
    },
  },
  {
    id: 'playful-rabbit',
    name: 'Playful Rabbit',
    type: 'rabbit',
    description: 'Active rabbits who love to hop, explore, and play',
    emoji: '🐇',
    defaults: {
      size: 'medium',
      activityLevel: 'high',
      personality: ['Playful', 'Active', 'Curious', 'Social', 'Friendly'],
      interests: ['Hopping', 'Exploring', 'Running', 'Playing', 'Toys', 'Digging'],
      lookingFor: ['Play Companion', 'Exercise Partner', 'Friend'],
      bio: 'Full of energy and loves to hop around! Always ready for playtime and exploring together.',
    },
  },
  {
    id: 'gentle-rabbit',
    name: 'Gentle Rabbit',
    type: 'rabbit',
    description: 'Calm, sweet rabbits who love quiet companionship',
    emoji: '🐰',
    defaults: {
      size: 'small',
      activityLevel: 'low',
      personality: ['Calm', 'Gentle', 'Affectionate', 'Cuddly', 'Social'],
      interests: ['Cuddling', 'Treats', 'Grooming', 'Garden Time', 'Hiding'],
      lookingFor: ['Cuddle Buddy', 'Friend', 'Warren Mate'],
      bio: 'A gentle soul who loves quiet moments and soft pets. Perfect for calm, relaxed companionship.',
    },
  },
  {
    id: 'community-fish',
    name: 'Community Fish',
    type: 'fish',
    description: 'Peaceful fish perfect for community tanks',
    emoji: '🐠',
    defaults: {
      size: 'small',
      activityLevel: 'moderate',
      personality: ['Peaceful', 'Social', 'Active', 'Hardy', 'Schooling'],
      interests: ['Swimming', 'Schooling', 'Exploring', 'Plants', 'Community Members'],
      lookingFor: ['Tank Mate', 'School Member', 'Peaceful Companion', 'Community Member'],
      bio: 'A peaceful community member who gets along with everyone. Perfect for harmonious tank life.',
    },
  },
  {
    id: 'colorful-fish',
    name: 'Colorful Display Fish',
    type: 'fish',
    description: 'Beautiful, vibrant fish that are the centerpiece of any tank',
    emoji: '🐟',
    defaults: {
      size: 'medium',
      activityLevel: 'moderate',
      personality: ['Active', 'Colorful', 'Social', 'Hardy', 'Peaceful'],
      interests: ['Swimming', 'Exploring', 'Decorations', 'Feeding Time', 'Surface Activity'],
      lookingFor: ['Tank Mate', 'Peaceful Companion', 'Friend'],
      bio: 'A stunning addition to any aquarium! Active, colorful, and peaceful with compatible tank mates.',
    },
  },
  {
    id: 'schooling-fish',
    name: 'Schooling Fish',
    type: 'fish',
    description: 'Fish who thrive in groups and love swimming together',
    emoji: '🐠',
    defaults: {
      size: 'small',
      activityLevel: 'high',
      personality: ['Social', 'Schooling', 'Active', 'Peaceful', 'Hardy'],
      interests: ['Schooling', 'Swimming', 'Exploring', 'Plants', 'Feeding Time'],
      lookingFor: ['School Member', 'Tank Mate', 'Community Member', 'Friend'],
      bio: 'Happiest in a school! Loves swimming in synchronized groups and exploring together.',
    },
  },
];

export function getTemplatesByType(type: PetType): PetProfileTemplate[] {
  return PET_PROFILE_TEMPLATES.filter((template) => template.type === type);
}

export function getTemplateById(id: string): PetProfileTemplate | undefined {
  return PET_PROFILE_TEMPLATES.find((template) => template.id === id);
}

export function applyTemplateToProfile(
  template: PetProfileTemplate,
  partialData: Partial<Pet>
): Partial<Pet> {
  return {
    ...partialData,
    personality: template.defaults.personality,
    interests: template.defaults.interests,
    lookingFor: template.defaults.lookingFor,
    bio: partialData.bio ?? template.defaults.bio ?? '',
    ...(partialData.size ?? template.defaults.size
      ? { size: partialData.size ?? template.defaults.size }
      : {}),
    ...(partialData.activityLevel ?? template.defaults.activityLevel
      ? { activityLevel: partialData.activityLevel ?? template.defaults.activityLevel }
      : {}),
    ...(partialData.breed ?? template.defaults.breed
      ? { breed: partialData.breed ?? template.defaults.breed ?? '' }
      : {}),
  };
}
