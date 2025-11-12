import type { StoryTemplate } from './stories-types';

export interface StoryFilter {
  id: string;
  name: string;
  category: 'vintage' | 'modern' | 'artistic' | 'playful' | 'dramatic' | 'natural';
  cssFilter: string;
  intensity: number;
  thumbnail?: string;
}

export interface AdvancedTemplate extends StoryTemplate {
  description: string;
  previewImage?: string;
  animationStyle?: 'fade' | 'slide' | 'zoom' | 'bounce' | 'rotate';
  textPosition?: 'top' | 'center' | 'bottom';
  textStyle?: {
    fontFamily: string;
    fontSize: string;
    color: string;
    textShadow?: string;
    fontWeight?: string;
  };
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
    name: 'Pastel',
    category: 'playful',
    cssFilter: 'saturate(0.6) brightness(1.2) contrast(0.9)',
    intensity: 0.7,
  },
];

export const ADVANCED_STORY_TEMPLATES: AdvancedTemplate[] = [
  {
    id: 'template-classic',
    name: 'Classic',
    description: 'Clean and simple',
    category: 'Basic',
    layoutType: 'single',
    backgroundColor: '#ffffff',
  },
  {
    id: 'template-sunset',
    name: 'Sunset Dreams',
    description: 'Warm gradient perfect for golden hour',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#FF6B6B', '#FFD93D', '#FFA500'],
    animationStyle: 'fade',
    textPosition: 'bottom',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '24px',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
      fontWeight: '700',
    },
  },
  {
    id: 'template-ocean',
    name: 'Ocean Waves',
    description: 'Cool and refreshing blue tones',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#0083B0', '#00B4DB', '#00D4FF'],
    animationStyle: 'slide',
    textPosition: 'center',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '28px',
      color: '#ffffff',
      textShadow: '0 2px 10px rgba(0,0,0,0.6)',
      fontWeight: '800',
    },
  },
  {
    id: 'template-neon',
    name: 'Neon Vibes',
    description: 'Electric gradient for bold content',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#B721FF', '#21D4FD', '#FF1CF7'],
    animationStyle: 'zoom',
    textPosition: 'top',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '32px',
      color: '#ffffff',
      textShadow: '0 0 20px rgba(183,33,255,0.8)',
      fontWeight: '900',
    },
  },
  {
    id: 'template-forest',
    name: 'Forest Adventure',
    description: 'Natural green gradient',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#134E5E', '#71B280', '#A8E6CF'],
    animationStyle: 'fade',
    textPosition: 'bottom',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '26px',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
      fontWeight: '700',
    },
  },
  {
    id: 'template-collage-2',
    name: 'Side by Side',
    description: 'Two photos in one story',
    category: 'Layout',
    layoutType: 'split',
    backgroundColor: '#000000',
    animationStyle: 'slide',
  },
  {
    id: 'template-collage-3',
    name: 'Triple View',
    description: 'Three photos arranged creatively',
    category: 'Layout',
    layoutType: 'collage',
    backgroundColor: '#ffffff',
    animationStyle: 'fade',
  },
  {
    id: 'template-grid-4',
    name: '4-Photo Grid',
    description: 'Perfect for showing multiple moments',
    category: 'Layout',
    layoutType: 'grid',
    backgroundColor: '#f5f5f5',
    animationStyle: 'zoom',
  },
  {
    id: 'template-minimal',
    name: 'Minimal White',
    description: 'Clean white background',
    category: 'Basic',
    layoutType: 'single',
    backgroundColor: '#ffffff',
    textPosition: 'bottom',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '20px',
      color: '#000000',
      fontWeight: '600',
    },
  },
  {
    id: 'template-minimal-dark',
    name: 'Minimal Black',
    description: 'Sleek black background',
    category: 'Basic',
    layoutType: 'single',
    backgroundColor: '#000000',
    textPosition: 'top',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '20px',
      color: '#ffffff',
      fontWeight: '600',
    },
  },
  {
    id: 'template-playful',
    name: 'Playful Pop',
    description: 'Fun and energetic',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#FF6B9D', '#FEC163', '#FAB2FF'],
    animationStyle: 'bounce',
    textPosition: 'center',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '30px',
      color: '#ffffff',
      textShadow: '0 4px 12px rgba(0,0,0,0.4)',
      fontWeight: '800',
    },
  },
  {
    id: 'template-elegant',
    name: 'Elegant Rose',
    description: 'Sophisticated rose gold tones',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#E0AFA0', '#F4DECB', '#D4A5A5'],
    animationStyle: 'fade',
    textPosition: 'bottom',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '24px',
      color: '#5A3E3E',
      fontWeight: '700',
    },
  },
  {
    id: 'template-midnight',
    name: 'Midnight Purple',
    description: 'Deep purple mystery',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#2E1F47', '#5E3370', '#8B4789'],
    animationStyle: 'fade',
    textPosition: 'center',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '28px',
      color: '#ffffff',
      textShadow: '0 2px 10px rgba(0,0,0,0.7)',
      fontWeight: '700',
    },
  },
  {
    id: 'template-autumn',
    name: 'Autumn Leaves',
    description: 'Warm fall colors',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#D7263D', '#F46036', '#C84632'],
    animationStyle: 'fade',
    textPosition: 'bottom',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '26px',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
      fontWeight: '700',
    },
  },
  {
    id: 'template-cherry',
    name: 'Cherry Blossom',
    description: 'Soft pink beauty',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#FFB6C1', '#FFC0CB', '#FFE4E1'],
    animationStyle: 'fade',
    textPosition: 'top',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '24px',
      color: '#8B4789',
      fontWeight: '700',
    },
  },
  {
    id: 'template-arctic',
    name: 'Arctic Ice',
    description: 'Cool winter vibes',
    category: 'Colorful',
    layoutType: 'single',
    backgroundGradient: ['#A8DADC', '#F1FAEE', '#E3F2FD'],
    animationStyle: 'fade',
    textPosition: 'center',
    textStyle: {
      fontFamily: 'Inter',
      fontSize: '26px',
      color: '#1D3557',
      fontWeight: '700',
    },
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '✨' },
  { id: 'Basic', name: 'Basic', icon: '⚪' },
  { id: 'Colorful', name: 'Colorful', icon: '🌈' },
  { id: 'Layout', name: 'Layout', icon: '🎨' },
];

export const FILTER_CATEGORIES = [
  { id: 'all', name: 'All Filters', icon: '🎭' },
  { id: 'natural', name: 'Natural', icon: '🌿' },
  { id: 'vintage', name: 'Vintage', icon: '📷' },
  { id: 'modern', name: 'Modern', icon: '✨' },
  { id: 'artistic', name: 'Artistic', icon: '🎨' },
  { id: 'playful', name: 'Playful', icon: '🎪' },
  { id: 'dramatic', name: 'Dramatic', icon: '🎬' },
];

export function applyFilter(
  imageElement: HTMLImageElement | HTMLVideoElement,
  filter: StoryFilter
): void {
  imageElement.style.filter = filter.cssFilter;
}

export function removeFilter(imageElement: HTMLImageElement | HTMLVideoElement): void {
  imageElement.style.filter = 'none';
}

export function getTemplatesByCategory(category: string): AdvancedTemplate[] {
  if (category === 'all') return ADVANCED_STORY_TEMPLATES;
  return ADVANCED_STORY_TEMPLATES.filter((t) => t.category === category);
}

export function getFiltersByCategory(category: string): StoryFilter[] {
  if (category === 'all') return STORY_FILTERS;
  return STORY_FILTERS.filter((f) => f.category === category);
}
