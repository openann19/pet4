import {
  Heart,
  Smiley,
  ThumbsUp,
  ThumbsDown,
  Fire,
  HandsPraying,
  Star,
} from '@phosphor-icons/react';
import type { ReactionOption } from './message-bubble-types';

export const REACTIONS: ReactionOption[] = [
  { type: '❤️', icon: Heart, label: 'Love' },
  { type: '😂', icon: Smiley, label: 'Laugh' },
  { type: '👍', icon: ThumbsUp, label: 'Like' },
  { type: '👎', icon: ThumbsDown, label: 'Dislike' },
  { type: '🔥', icon: Fire, label: 'Fire' },
  { type: '🙏', icon: HandsPraying, label: 'Pray' },
  { type: '⭐', icon: Star, label: 'Star' },
];

