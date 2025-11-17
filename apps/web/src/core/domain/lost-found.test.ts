import { describe, it, expect } from 'vitest';
import {
  isValidLostAlertStatusTransition,
  canReceiveSightings,
  canEditAlert,
  canMarkAsFound,
} from './lost-found';

describe('Lost & Found Domain', () => {
  describe('isValidLostAlertStatusTransition', () => {
    it('should not allow transition to same status', () => {
      expect(isValidLostAlertStatusTransition('active', 'active')).toBe(false);
      expect(isValidLostAlertStatusTransition('found', 'found')).toBe(false);
    });

    it('should allow active -> found', () => {
      expect(isValidLostAlertStatusTransition('active', 'found')).toBe(true);
    });

    it('should allow active -> archived', () => {
      expect(isValidLostAlertStatusTransition('active', 'archived')).toBe(true);
    });

    it('should allow found -> archived', () => {
      expect(isValidLostAlertStatusTransition('found', 'archived')).toBe(true);
    });

    it('should not allow archived -> any status', () => {
      expect(isValidLostAlertStatusTransition('archived', 'active')).toBe(false);
      expect(isValidLostAlertStatusTransition('archived', 'found')).toBe(false);
    });

    it('should not allow found -> active', () => {
      expect(isValidLostAlertStatusTransition('found', 'active')).toBe(false);
    });
  });

  describe('canReceiveSightings', () => {
    it('should allow sightings for active', () => {
      expect(canReceiveSightings('active')).toBe(true);
    });

    it('should not allow sightings for found', () => {
      expect(canReceiveSightings('found')).toBe(false);
    });

    it('should not allow sightings for archived', () => {
      expect(canReceiveSightings('archived')).toBe(false);
    });
  });

  describe('canEditAlert', () => {
    it('should allow editing for active', () => {
      expect(canEditAlert('active')).toBe(true);
    });

    it('should not allow editing for found', () => {
      expect(canEditAlert('found')).toBe(false);
    });

    it('should not allow editing for archived', () => {
      expect(canEditAlert('archived')).toBe(false);
    });
  });

  describe('canMarkAsFound', () => {
    it('should allow marking as found for active', () => {
      expect(canMarkAsFound('active')).toBe(true);
    });

    it('should not allow marking as found for found', () => {
      expect(canMarkAsFound('found')).toBe(false);
    });

    it('should not allow marking as found for archived', () => {
      expect(canMarkAsFound('archived')).toBe(false);
    });
  });
});
