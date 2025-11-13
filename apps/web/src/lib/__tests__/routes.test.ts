/**
 * Navigation Routes Tests
 * Tests for typed navigation contracts and route validation
 */

import { describe, it, expect } from 'vitest';
import {
  routes,
  validateRouteParams,
  getSafeRouteParams,
  isValidView,
  getDefaultView,
  type View,
} from '../routes';

describe('routes', () => {
  describe('route helpers', () => {
    it('should create discover route config', () => {
      const config = routes.toDiscover();
      expect(config.view).toBe('discover');
      expect(config.params).toBeUndefined();
    });

    it('should create discover route with params', () => {
      const config = routes.toDiscover({ petId: '123' });
      expect(config.view).toBe('discover');
      expect(config.params?.petId).toBe('123');
    });

    it('should create chat route config', () => {
      const config = routes.toChat({ chatId: 'chat-1', matchId: 'match-1' });
      expect(config.view).toBe('chat');
      expect(config.params?.chatId).toBe('chat-1');
      expect(config.params?.matchId).toBe('match-1');
    });

    it('should create matches route config', () => {
      const config = routes.toMatches({ matchId: 'match-1' });
      expect(config.view).toBe('matches');
      expect(config.params?.matchId).toBe('match-1');
    });

    it('should create profile route config', () => {
      const config = routes.toProfile({ petId: 'pet-1', userId: 'user-1' });
      expect(config.view).toBe('profile');
      expect(config.params?.petId).toBe('pet-1');
      expect(config.params?.userId).toBe('user-1');
    });
  });

  describe('route validation', () => {
    it('should validate valid chat params', () => {
      const params = validateRouteParams('chat', { chatId: 'chat-1' });
      expect(params.chatId).toBe('chat-1');
    });

    it('should validate valid matches params', () => {
      const params = validateRouteParams('matches', { matchId: 'match-1' });
      expect(params.matchId).toBe('match-1');
    });

    it('should throw on invalid params', () => {
      expect(() => {
        validateRouteParams('chat', { invalid: 'value' });
      }).toThrow();
    });

    it('should return safe defaults on invalid params', () => {
      const params = getSafeRouteParams('chat', { invalid: 'value' });
      expect(params).toEqual({});
    });
  });

  describe('view validation', () => {
    it('should validate valid views', () => {
      expect(isValidView('discover')).toBe(true);
      expect(isValidView('matches')).toBe(true);
      expect(isValidView('chat')).toBe(true);
      expect(isValidView('community')).toBe(true);
      expect(isValidView('adoption')).toBe(true);
      expect(isValidView('lost-found')).toBe(true);
      expect(isValidView('profile')).toBe(true);
    });

    it('should reject invalid views', () => {
      expect(isValidView('invalid')).toBe(false);
      expect(isValidView('')).toBe(false);
      expect(isValidView('home')).toBe(false);
    });

    it('should return default view', () => {
      const defaultView = getDefaultView();
      expect(isValidView(defaultView)).toBe(true);
      expect(defaultView).toBe('discover');
    });
  });
});

