export interface StickerCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Sticker {
  id: string;
  categoryId: string;
  emoji: string;
  animation?: 'bounce' | 'spin' | 'pulse' | 'shake' | 'float' | 'grow' | 'wiggle' | 'flip';
  label: string;
  keywords: string[];
  premium?: boolean;
}

export const STICKER_CATEGORIES: StickerCategory[] = [
  { id: 'love', name: 'Love & Hearts', emoji: '❤️', color: 'oklch(0.72 0.15 25)' },
  { id: 'happy', name: 'Happy & Excited', emoji: '😊', color: 'oklch(0.68 0.18 45)' },
  { id: 'pets', name: 'Pet Life', emoji: '🐾', color: 'oklch(0.65 0.12 200)' },
  { id: 'playful', name: 'Playful & Fun', emoji: '🎉', color: 'oklch(0.70 0.10 290)' },
  { id: 'reactions', name: 'Reactions', emoji: '😮', color: 'oklch(0.75 0.18 25)' },
  { id: 'activities', name: 'Activities', emoji: '🏃', color: 'oklch(0.68 0.15 200)' },
  { id: 'food', name: 'Food & Treats', emoji: '🍖', color: 'oklch(0.72 0.20 45)' },
  { id: 'weather', name: 'Weather & Nature', emoji: '🌤️', color: 'oklch(0.65 0.12 180)' },
];

export const STICKER_LIBRARY: Sticker[] = [
  {
    id: 'heart-eyes',
    categoryId: 'love',
    emoji: '😍',
    animation: 'pulse',
    label: 'Heart Eyes',
    keywords: ['love', 'adore', 'cute'],
  },
  {
    id: 'kiss',
    categoryId: 'love',
    emoji: '😘',
    animation: 'float',
    label: 'Blow Kiss',
    keywords: ['kiss', 'love', 'sweet'],
  },
  {
    id: 'heart',
    categoryId: 'love',
    emoji: '❤️',
    animation: 'bounce',
    label: 'Red Heart',
    keywords: ['heart', 'love', 'like'],
  },
  {
    id: 'hearts',
    categoryId: 'love',
    emoji: '💕',
    animation: 'pulse',
    label: 'Two Hearts',
    keywords: ['love', 'hearts', 'couple'],
  },
  {
    id: 'sparkling-heart',
    categoryId: 'love',
    emoji: '💖',
    animation: 'grow',
    label: 'Sparkling Heart',
    keywords: ['sparkle', 'love', 'special'],
    premium: true,
  },
  {
    id: 'heart-hands',
    categoryId: 'love',
    emoji: '🫶',
    animation: 'bounce',
    label: 'Heart Hands',
    keywords: ['love', 'care', 'support'],
  },
  {
    id: 'cupid',
    categoryId: 'love',
    emoji: '💘',
    animation: 'spin',
    label: 'Cupid Arrow',
    keywords: ['love', 'crush', 'match'],
    premium: true,
  },
  {
    id: 'love-letter',
    categoryId: 'love',
    emoji: '💌',
    animation: 'float',
    label: 'Love Letter',
    keywords: ['letter', 'message', 'love'],
  },

  {
    id: 'smile',
    categoryId: 'happy',
    emoji: '😊',
    animation: 'bounce',
    label: 'Smiling Face',
    keywords: ['happy', 'smile', 'good'],
  },
  {
    id: 'grin',
    categoryId: 'happy',
    emoji: '😁',
    animation: 'shake',
    label: 'Beaming Smile',
    keywords: ['happy', 'excited', 'joy'],
  },
  {
    id: 'joy',
    categoryId: 'happy',
    emoji: '😂',
    animation: 'shake',
    label: 'Tears of Joy',
    keywords: ['laugh', 'funny', 'lol'],
  },
  {
    id: 'star-eyes',
    categoryId: 'happy',
    emoji: '🤩',
    animation: 'pulse',
    label: 'Star Eyes',
    keywords: ['amazed', 'wow', 'impressed'],
  },
  {
    id: 'party',
    categoryId: 'happy',
    emoji: '🥳',
    animation: 'spin',
    label: 'Party Face',
    keywords: ['party', 'celebrate', 'birthday'],
    premium: true,
  },
  {
    id: 'sparkles',
    categoryId: 'happy',
    emoji: '✨',
    animation: 'float',
    label: 'Sparkles',
    keywords: ['sparkle', 'magic', 'special'],
  },
  {
    id: 'rainbow',
    categoryId: 'happy',
    emoji: '🌈',
    animation: 'float',
    label: 'Rainbow',
    keywords: ['rainbow', 'colorful', 'happy'],
  },
  {
    id: 'sun',
    categoryId: 'happy',
    emoji: '☀️',
    animation: 'spin',
    label: 'Sun',
    keywords: ['sun', 'bright', 'warm'],
  },

  {
    id: 'dog',
    categoryId: 'pets',
    emoji: '🐕',
    animation: 'bounce',
    label: 'Dog',
    keywords: ['dog', 'pet', 'puppy'],
  },
  {
    id: 'cat',
    categoryId: 'pets',
    emoji: '🐈',
    animation: 'bounce',
    label: 'Cat',
    keywords: ['cat', 'pet', 'kitty'],
  },
  {
    id: 'paw',
    categoryId: 'pets',
    emoji: '🐾',
    animation: 'shake',
    label: 'Paw Prints',
    keywords: ['paw', 'pet', 'animal'],
  },
  {
    id: 'bone',
    categoryId: 'pets',
    emoji: '🦴',
    animation: 'wiggle',
    label: 'Bone',
    keywords: ['bone', 'dog', 'treat'],
  },
  {
    id: 'service-dog',
    categoryId: 'pets',
    emoji: '🦮',
    animation: 'float',
    label: 'Service Dog',
    keywords: ['service', 'helper', 'dog'],
    premium: true,
  },
  {
    id: 'guide-dog',
    categoryId: 'pets',
    emoji: '🐕‍🦺',
    animation: 'bounce',
    label: 'Guide Dog',
    keywords: ['guide', 'service', 'dog'],
  },
  {
    id: 'rabbit',
    categoryId: 'pets',
    emoji: '🐇',
    animation: 'bounce',
    label: 'Rabbit',
    keywords: ['rabbit', 'bunny', 'pet'],
  },
  {
    id: 'bird',
    categoryId: 'pets',
    emoji: '🐦',
    animation: 'float',
    label: 'Bird',
    keywords: ['bird', 'pet', 'flying'],
  },

  {
    id: 'ball',
    categoryId: 'playful',
    emoji: '⚽',
    animation: 'bounce',
    label: 'Ball',
    keywords: ['ball', 'play', 'fetch'],
  },
  {
    id: 'party-popper',
    categoryId: 'playful',
    emoji: '🎉',
    animation: 'spin',
    label: 'Party Popper',
    keywords: ['party', 'celebrate', 'yay'],
  },
  {
    id: 'balloon',
    categoryId: 'playful',
    emoji: '🎈',
    animation: 'float',
    label: 'Balloon',
    keywords: ['balloon', 'party', 'fun'],
  },
  {
    id: 'gift',
    categoryId: 'playful',
    emoji: '🎁',
    animation: 'shake',
    label: 'Gift',
    keywords: ['gift', 'present', 'surprise'],
  },
  {
    id: 'confetti',
    categoryId: 'playful',
    emoji: '🎊',
    animation: 'spin',
    label: 'Confetti',
    keywords: ['confetti', 'celebrate', 'party'],
    premium: true,
  },
  {
    id: 'trophy',
    categoryId: 'playful',
    emoji: '🏆',
    animation: 'pulse',
    label: 'Trophy',
    keywords: ['trophy', 'winner', 'best'],
    premium: true,
  },
  {
    id: 'medal',
    categoryId: 'playful',
    emoji: '🏅',
    animation: 'bounce',
    label: 'Medal',
    keywords: ['medal', 'award', 'champion'],
  },
  {
    id: 'ribbon',
    categoryId: 'playful',
    emoji: '🎀',
    animation: 'wiggle',
    label: 'Ribbon',
    keywords: ['ribbon', 'cute', 'pretty'],
  },

  {
    id: 'thinking',
    categoryId: 'reactions',
    emoji: '🤔',
    animation: 'wiggle',
    label: 'Thinking',
    keywords: ['thinking', 'hmm', 'wonder'],
  },
  {
    id: 'surprised',
    categoryId: 'reactions',
    emoji: '😮',
    animation: 'grow',
    label: 'Surprised',
    keywords: ['wow', 'surprised', 'omg'],
  },
  {
    id: 'shocked',
    categoryId: 'reactions',
    emoji: '😱',
    animation: 'shake',
    label: 'Shocked',
    keywords: ['shocked', 'scared', 'omg'],
  },
  {
    id: 'cool',
    categoryId: 'reactions',
    emoji: '😎',
    animation: 'bounce',
    label: 'Cool',
    keywords: ['cool', 'awesome', 'nice'],
  },
  {
    id: 'wink',
    categoryId: 'reactions',
    emoji: '😉',
    animation: 'bounce',
    label: 'Wink',
    keywords: ['wink', 'playful', 'fun'],
  },
  {
    id: 'fire',
    categoryId: 'reactions',
    emoji: '🔥',
    animation: 'pulse',
    label: 'Fire',
    keywords: ['fire', 'hot', 'amazing'],
    premium: true,
  },
  {
    id: 'clap',
    categoryId: 'reactions',
    emoji: '👏',
    animation: 'shake',
    label: 'Clapping',
    keywords: ['clap', 'applause', 'good'],
  },
  {
    id: 'thumbs-up',
    categoryId: 'reactions',
    emoji: '👍',
    animation: 'bounce',
    label: 'Thumbs Up',
    keywords: ['thumbs', 'yes', 'agree'],
  },

  {
    id: 'running',
    categoryId: 'activities',
    emoji: '🏃',
    animation: 'bounce',
    label: 'Running',
    keywords: ['run', 'exercise', 'active'],
  },
  {
    id: 'walk',
    categoryId: 'activities',
    emoji: '🚶',
    animation: 'float',
    label: 'Walking',
    keywords: ['walk', 'stroll', 'casual'],
  },
  {
    id: 'park',
    categoryId: 'activities',
    emoji: '🏞️',
    animation: 'float',
    label: 'Park',
    keywords: ['park', 'nature', 'outdoor'],
  },
  {
    id: 'tent',
    categoryId: 'activities',
    emoji: '⛺',
    animation: 'bounce',
    label: 'Camping',
    keywords: ['camp', 'tent', 'outdoor'],
  },
  {
    id: 'swimming',
    categoryId: 'activities',
    emoji: '🏊',
    animation: 'wiggle',
    label: 'Swimming',
    keywords: ['swim', 'water', 'pool'],
    premium: true,
  },
  {
    id: 'mountain',
    categoryId: 'activities',
    emoji: '⛰️',
    animation: 'float',
    label: 'Mountain',
    keywords: ['mountain', 'hike', 'climb'],
  },
  {
    id: 'beach',
    categoryId: 'activities',
    emoji: '🏖️',
    animation: 'float',
    label: 'Beach',
    keywords: ['beach', 'sand', 'ocean'],
  },
  {
    id: 'camera',
    categoryId: 'activities',
    emoji: '📸',
    animation: 'bounce',
    label: 'Camera',
    keywords: ['photo', 'picture', 'snap'],
  },

  {
    id: 'meat',
    categoryId: 'food',
    emoji: '🍖',
    animation: 'bounce',
    label: 'Meat',
    keywords: ['meat', 'food', 'treat'],
  },
  {
    id: 'apple',
    categoryId: 'food',
    emoji: '🍎',
    animation: 'spin',
    label: 'Apple',
    keywords: ['apple', 'fruit', 'healthy'],
  },
  {
    id: 'carrot',
    categoryId: 'food',
    emoji: '🥕',
    animation: 'wiggle',
    label: 'Carrot',
    keywords: ['carrot', 'veggie', 'healthy'],
  },
  {
    id: 'pizza',
    categoryId: 'food',
    emoji: '🍕',
    animation: 'spin',
    label: 'Pizza',
    keywords: ['pizza', 'food', 'yum'],
  },
  {
    id: 'birthday-cake',
    categoryId: 'food',
    emoji: '🎂',
    animation: 'pulse',
    label: 'Birthday Cake',
    keywords: ['cake', 'birthday', 'celebrate'],
    premium: true,
  },
  {
    id: 'cookie',
    categoryId: 'food',
    emoji: '🍪',
    animation: 'bounce',
    label: 'Cookie',
    keywords: ['cookie', 'treat', 'snack'],
  },
  {
    id: 'water',
    categoryId: 'food',
    emoji: '💧',
    animation: 'float',
    label: 'Water',
    keywords: ['water', 'drink', 'hydrate'],
  },
  {
    id: 'ice-cream',
    categoryId: 'food',
    emoji: '🍦',
    animation: 'wiggle',
    label: 'Ice Cream',
    keywords: ['ice cream', 'treat', 'sweet'],
  },

  {
    id: 'sunny',
    categoryId: 'weather',
    emoji: '☀️',
    animation: 'spin',
    label: 'Sunny',
    keywords: ['sun', 'sunny', 'bright'],
  },
  {
    id: 'cloudy',
    categoryId: 'weather',
    emoji: '☁️',
    animation: 'float',
    label: 'Cloudy',
    keywords: ['cloud', 'cloudy', 'sky'],
  },
  {
    id: 'rain',
    categoryId: 'weather',
    emoji: '🌧️',
    animation: 'float',
    label: 'Rain',
    keywords: ['rain', 'rainy', 'wet'],
  },
  {
    id: 'snow',
    categoryId: 'weather',
    emoji: '❄️',
    animation: 'spin',
    label: 'Snow',
    keywords: ['snow', 'cold', 'winter'],
  },
  {
    id: 'thunder',
    categoryId: 'weather',
    emoji: '⚡',
    animation: 'shake',
    label: 'Thunder',
    keywords: ['thunder', 'lightning', 'storm'],
    premium: true,
  },
  {
    id: 'tree',
    categoryId: 'weather',
    emoji: '🌳',
    animation: 'bounce',
    label: 'Tree',
    keywords: ['tree', 'nature', 'green'],
  },
  {
    id: 'flower',
    categoryId: 'weather',
    emoji: '🌸',
    animation: 'pulse',
    label: 'Flower',
    keywords: ['flower', 'pretty', 'nature'],
  },
  {
    id: 'leaf',
    categoryId: 'weather',
    emoji: '🍃',
    animation: 'float',
    label: 'Leaf',
    keywords: ['leaf', 'nature', 'fall'],
  },
];

export function getStickersByCategory(categoryId: string): Sticker[] {
  return STICKER_LIBRARY.filter((s) => s.categoryId === categoryId);
}

export function searchStickers(query: string): Sticker[] {
  if (!query.trim()) return STICKER_LIBRARY;

  const lowerQuery = query.toLowerCase();
  return STICKER_LIBRARY.filter(
    (s) =>
      s.label.toLowerCase().includes(lowerQuery) || s.keywords.some((k) => k.includes(lowerQuery))
  );
}

export function getPremiumStickers(): Sticker[] {
  return STICKER_LIBRARY.filter((s) => s.premium);
}

export function getRecentStickers(recentIds: string[]): Sticker[] {
  return recentIds
    .map((id) => STICKER_LIBRARY.find((s) => s.id === id))
    .filter((s): s is Sticker => s !== undefined);
}
