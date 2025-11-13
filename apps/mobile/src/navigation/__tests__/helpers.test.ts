/**
 * Mobile Navigation Helpers Tests
 * Tests for typed navigation contracts and route validation
 */

import { describe, it, expect } from 'vitest';
import {
  stackRoutes,
  tabRoutes,
  validateRouteParams,
  getSafeRouteParams,
} from '../helpers';

describe('mobile navigation helpers', () => {
  describe('stack routes', () => {
    it('should create MainTabs route', () => {
      const route = stackRoutes.toMainTabs();
      expect(route.screen).toBe('MainTabs');
      expect(route.params).toBeUndefined();
    });

    it('should create SignIn route', () => {
      const route = stackRoutes.toSignIn();
      expect(route.screen).toBe('SignIn');
      expect(route.params).toBeUndefined();
    });

    it('should create UploadAndEdit route with params', () => {
      const onDone = () => {};
      const route = stackRoutes.toUploadAndEdit({ onDone });
      expect(route.screen).toBe('UploadAndEdit');
      expect(route.params.onDone).toBe(onDone);
    });
  });

  describe('tab routes', () => {
    it('should create Feed route', () => {
      const route = tabRoutes.toFeed();
      expect(route.screen).toBe('Feed');
      expect(route.params).toBeUndefined();
    });

    it('should create Chat route with params', () => {
      const route = tabRoutes.toChat({ chatId: 'chat-1', matchId: 'match-1' });
      expect(route.screen).toBe('Chat');
      expect(route.params?.chatId).toBe('chat-1');
      expect(route.params?.matchId).toBe('match-1');
    });

    it('should create Matches route with params', () => {
      const route = tabRoutes.toMatches({ matchId: 'match-1' });
      expect(route.screen).toBe('Matches');
      expect(route.params?.matchId).toBe('match-1');
    });
  });

  describe('route validation', () => {
    it('should validate valid Chat params', () => {
      const params = validateRouteParams('Chat', { chatId: 'chat-1' });
      expect(params.chatId).toBe('chat-1');
    });

    it('should validate valid Matches params', () => {
      const params = validateRouteParams('Matches', { matchId: 'match-1' });
      expect(params.matchId).toBe('match-1');
    });

    it('should throw on invalid params', () => {
      expect(() => {
        validateRouteParams('Chat', { invalid: 'value' });
      }).toThrow();
    });

    it('should return safe defaults on invalid params', () => {
      const params = getSafeRouteParams('Chat', { invalid: 'value' });
      expect(params).toEqual({});
    });
  });
});

