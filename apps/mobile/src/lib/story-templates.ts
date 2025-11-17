export interface StoryFilter {
  id: string
  name: string
  category: 'vintage' | 'modern' | 'artistic' | 'playful' | 'dramatic' | 'natural'
  cssFilter: string
  intensity: number
  thumbnail?: string
}

export const STORY_FILTERS: StoryFilter[] = [
  {
    id: 'filter-none',
    name: 'Original',
    category: 'natural',
    cssFilter: 'none',
    intensity: 1,
  },
  {
    id: 'filter-warm',
    name: 'Warm Glow',
    category: 'natural',
    cssFilter: 'sepia(0.3) saturate(1.3) brightness(1.1)',
    intensity: 0.7,
  },
  {
    id: 'filter-cool',
    name: 'Cool Breeze',
    category: 'modern',
    cssFilter: 'hue-rotate(20deg) saturate(1.2) brightness(1.05)',
    intensity: 0.6,
  },
  {
    id: 'filter-vintage',
    name: 'Vintage',
    category: 'vintage',
    cssFilter: 'sepia(0.5) contrast(0.9) brightness(1.1)',
    intensity: 0.8,
  },
  {
    id: 'filter-noir',
    name: 'Noir',
    category: 'dramatic',
    cssFilter: 'grayscale(1) contrast(1.3) brightness(0.9)',
    intensity: 1,
  },
  {
    id: 'filter-vibrant',
    name: 'Vibrant',
    category: 'playful',
    cssFilter: 'saturate(1.8) contrast(1.1)',
    intensity: 0.9,
  },
  {
    id: 'filter-dreamy',
    name: 'Dreamy',
    category: 'artistic',
    cssFilter: 'brightness(1.1) saturate(0.8) contrast(0.9) blur(0.3px)',
    intensity: 0.7,
  },
  {
    id: 'filter-sunset',
    name: 'Golden Sunset',
    category: 'dramatic',
    cssFilter: 'sepia(0.4) saturate(1.4) hue-rotate(-10deg) brightness(1.1)',
    intensity: 0.8,
  },
  {
    id: 'filter-ocean',
    name: 'Ocean Blue',
    category: 'modern',
    cssFilter: 'hue-rotate(180deg) saturate(1.2) brightness(1.05)',
    intensity: 0.7,
  },
  {
    id: 'filter-forest',
    name: 'Forest Green',
    category: 'natural',
    cssFilter: 'hue-rotate(80deg) saturate(1.3) brightness(0.95)',
    intensity: 0.75,
  },
  {
    id: 'filter-pink',
    name: 'Pink Dreams',
    category: 'playful',
    cssFilter: 'hue-rotate(-30deg) saturate(1.5) brightness(1.15)',
    intensity: 0.8,
  },
  {
    id: 'filter-sharp',
    name: 'Ultra Sharp',
    category: 'modern',
    cssFilter: 'contrast(1.3) saturate(1.2) brightness(1.05)',
    intensity: 0.9,
  },
  {
    id: 'filter-soft',
    name: 'Soft Focus',
    category: 'artistic',
    cssFilter: 'brightness(1.15) contrast(0.85) saturate(0.9)',
    intensity: 0.6,
  },
  {
    id: 'filter-neon',
    name: 'Neon Nights',
    category: 'dramatic',
    cssFilter: 'saturate(2) contrast(1.4) brightness(0.9)',
    intensity: 1,
  },
  {
    id: 'filter-pastel',
    name: 'Pastel Dreams',
    category: 'artistic',
    cssFilter: 'saturate(0.6) brightness(1.2) contrast(0.9)',
    intensity: 0.7,
  },
  {
    id: 'filter-mono',
    name: 'Monochrome',
    category: 'dramatic',
    cssFilter: 'grayscale(1) contrast(1.2)',
    intensity: 0.9,
  },
  {
    id: 'filter-cinema',
    name: 'Cinema',
    category: 'dramatic',
    cssFilter: 'contrast(1.2) brightness(0.95) saturate(1.1)',
    intensity: 0.85,
  },
]

export const FILTER_CATEGORIES = [
  { id: 'all', name: 'All Filters', icon: '🎭' },
  { id: 'natural', name: 'Natural', icon: '🌿' },
  { id: 'vintage', name: 'Vintage', icon: '📷' },
  { id: 'modern', name: 'Modern', icon: '✨' },
  { id: 'artistic', name: 'Artistic', icon: '🎨' },
  { id: 'playful', name: 'Playful', icon: '🎪' },
  { id: 'dramatic', name: 'Dramatic', icon: '🎬' },
]

export function getFiltersByCategory(category: string): StoryFilter[] {
  if (category === 'all') return STORY_FILTERS
  return STORY_FILTERS.filter(f => f.category === category)
}
