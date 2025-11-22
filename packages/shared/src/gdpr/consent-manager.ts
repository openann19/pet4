/**
 * Consent Manager
 *
 * Utilities for managing user consent preferences and status.
 */

import type {
  ConsentCategory,
  ConsentStatus,
  ConsentPreferences,
  ConsentRecord,
} from './consent-types';

export class ConsentManager {
  /**
   * Check if consent is required for a category
   */
  static isConsentRequired(category: ConsentCategory): boolean {
    return category !== 'essential';
  }

  /**
   * Check if consent is granted for a category
   */
  static hasConsent(consents: ConsentRecord[], category: ConsentCategory): boolean {
    if (category === 'essential') {
      return true;
    }

    const consent = consents.find((c) => c.category === category);
    return consent?.status === 'accepted';
  }

  /**
   * Get consent preferences from consent records
   */
  static getConsentPreferences(consents: ConsentRecord[]): ConsentPreferences {
    return {
      essential: true,
      analytics: this.hasConsent(consents, 'analytics'),
      marketing: this.hasConsent(consents, 'marketing'),
      thirdParty: this.hasConsent(consents, 'third_party'),
    };
  }

  /**
   * Check if all required consents are granted
   */
  static hasRequiredConsents(consents: ConsentRecord[]): boolean {
    const requiredCategories: ConsentCategory[] = ['essential', 'analytics'];
    return requiredCategories.every((category) => this.hasConsent(consents, category));
  }

  /**
   * Get consent status for a category
   */
  static getConsentStatus(
    consents: ConsentRecord[],
    category: ConsentCategory
  ): ConsentStatus {
    if (category === 'essential') {
      return 'accepted';
    }

    const consent = consents.find((c) => c.category === category);
    return consent?.status ?? 'pending';
  }

  /**
   * Check if consent can be withdrawn
   */
  static canWithdrawConsent(category: ConsentCategory): boolean {
    return category !== 'essential';
  }

  /**
   * Validate consent update
   */
  static validateConsentUpdate(
    category: ConsentCategory,
    status: ConsentStatus
  ): boolean {
    if (category === 'essential' && status !== 'accepted') {
      return false;
    }

    return true;
  }

  /**
   * Get consent record for a category
   */
  static getConsentRecord(
    consents: ConsentRecord[],
    category: ConsentCategory
  ): ConsentRecord | undefined {
    return consents.find((c) => c.category === category);
  }

  /**
   * Filter consents by status
   */
  static filterByStatus(
    consents: ConsentRecord[],
    status: ConsentStatus
  ): ConsentRecord[] {
    return consents.filter((c) => c.status === status);
  }

  /**
   * Get latest consent version
   */
  static getLatestConsentVersion(consents: ConsentRecord[]): string {
    if (consents.length === 0) {
      return '1.0.0';
    }

    const versions = consents.map((c) => c.version);
    return versions.sort().reverse()[0] ?? '1.0.0';
  }
}

