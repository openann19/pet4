/**
 * GDPR-compliant privacy consent management
 *
 * Features:
 * - Granular consent categories (essential, analytics, marketing)
 * - Consent version tracking
 * - Automatic UI for consent collection
 * - Persistent consent storage
 * - Data deletion requests (Right to be Forgotten)
 * - Data export (Data Portability)
 * - Consent withdrawal tracking
 * - Compliance audit logging
 *
 * @example
 * ```tsx
 * const privacy = usePrivacyConsent({
 *   onConsentChange: (consents) => updateTracking(consents),
 *   onDataDeletionRequest: () => initiateDataDeletion(),
 *   requiredVersion: '2.0'
 * });
 *
 * // Check consent
 * if (privacy.hasConsent('analytics')) {
 *   trackEvent('page_view');
 * }
 *
 * // Show consent UI if needed
 * if (!privacy.isConsentGiven) {
 *   privacy.showConsentUI();
 * }
 *
 * // Request data deletion
 * await privacy.requestDataDeletion();
 * ```
 */

import { useState, useCallback, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ConsentCategory =
  | 'essential'
  | 'functional'
  | 'analytics'
  | 'marketing'
  | 'personalization';

export type ConsentState = Readonly<Record<string, boolean>>;

export interface ConsentRecord {
  readonly consents: ConsentState;
  readonly version: string;
  readonly timestamp: number;
  readonly ip?: string;
  readonly userAgent: string;
}

export interface PrivacyConsentConfig {
  readonly userId?: string;
  readonly onConsentChange?: (consents: ConsentState) => void;
  readonly onDataDeletionRequest?: () => void;
  readonly onDataExportRequest?: () => void;
  readonly requiredVersion?: string;
  readonly defaultConsents?: Partial<ConsentState>;
}

export interface PrivacyState {
  readonly isConsentGiven: boolean;
  readonly consents: ConsentState;
  readonly consentVersion: string | null;
  readonly consentTimestamp: number | null;
  readonly needsUpdate: boolean;
  readonly dataDeletionRequested: boolean;
}

export interface DataExportData {
  readonly userId: string;
  readonly consentHistory: readonly ConsentRecord[];
  readonly dataCategories: Record<string, unknown>;
  readonly exportTimestamp: number;
  readonly format: 'json' | 'csv';
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_CONSENT = 'petspark_privacy_consent';
const STORAGE_KEY_HISTORY = 'petspark_privacy_history';
const STORAGE_KEY_DELETION = 'petspark_privacy_deletion_request';
const DEFAULT_VERSION = '1.0';

const CONSENT_DESCRIPTIONS: Record<ConsentCategory, string> = {
  essential: 'Required for the app to function. Cannot be disabled.',
  functional: 'Enables enhanced functionality and personalization.',
  analytics: 'Helps us improve the app by collecting usage statistics.',
  marketing: 'Allows us to show you relevant promotions and offers.',
  personalization: 'Customizes your experience based on your preferences.',
};

// ============================================================================
// Utilities
// ============================================================================

function getDefaultConsents(): ConsentState {
  return {
    essential: true, // Always required
    functional: false,
    analytics: false,
    marketing: false,
    personalization: false,
  };
}

function loadConsentRecord(): ConsentRecord | null {
  const stored = localStorage.getItem(STORAGE_KEY_CONSENT);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ConsentRecord;
  } catch {
    return null;
  }
}

function saveConsentRecord(record: ConsentRecord): void {
  localStorage.setItem(STORAGE_KEY_CONSENT, JSON.stringify(record));

  // Add to history
  const history = loadConsentHistory();
  history.push(record);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
}

function loadConsentHistory(): ConsentRecord[] {
  const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as ConsentRecord[];
  } catch {
    return [];
  }
}

function needsConsentUpdate(
  currentVersion: string | null,
  requiredVersion: string
): boolean {
  if (!currentVersion) return true;

  // Simple version comparison (assumes semantic versioning)
  const current = currentVersion.split('.').map(Number);
  const required = requiredVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(current.length, required.length); i++) {
    const c = current[i] ?? 0;
    const r = required[i] ?? 0;
    if (c < r) return true;
    if (c > r) return false;
  }

  return false;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePrivacyConsent(config: PrivacyConsentConfig = {}) {
  const {
    userId,
    onConsentChange,
    onDataDeletionRequest,
    onDataExportRequest,
    requiredVersion = DEFAULT_VERSION,
    defaultConsents,
  } = config;

  // Load existing consent
  const existingRecord = loadConsentRecord();

  // State
  const [state, setState] = useState<PrivacyState>(() => {
    if (!existingRecord) {
      const defaults = getDefaultConsents();
      return {
        isConsentGiven: false,
        consents: { ...defaults, ...(defaultConsents ?? {}) } as ConsentState,
        consentVersion: null,
        consentTimestamp: null,
        needsUpdate: true,
        dataDeletionRequested: false,
      };
    }

    return {
      isConsentGiven: true,
      consents: existingRecord.consents,
      consentVersion: existingRecord.version,
      consentTimestamp: existingRecord.timestamp,
      needsUpdate: needsConsentUpdate(existingRecord.version, requiredVersion),
      dataDeletionRequested:
        localStorage.getItem(STORAGE_KEY_DELETION) !== null,
    };
  });

  // ============================================================================
  // Consent Management
  // ============================================================================

  const giveConsent = useCallback(
    (consents: Partial<ConsentState>) => {
      const finalConsents: ConsentState = {
        ...getDefaultConsents(),
        ...defaultConsents,
        ...consents,
        essential: true, // Always required
      };

      const record: ConsentRecord = {
        consents: finalConsents,
        version: requiredVersion,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      };

      saveConsentRecord(record);

      setState({
        isConsentGiven: true,
        consents: finalConsents,
        consentVersion: requiredVersion,
        consentTimestamp: record.timestamp,
        needsUpdate: false,
        dataDeletionRequested: false,
      });

      if (onConsentChange) {
        onConsentChange(finalConsents);
      }
    },
    [requiredVersion, defaultConsents, onConsentChange]
  );

  const updateConsent = useCallback(
    (category: ConsentCategory, granted: boolean) => {
      if (category === 'essential') {
        // Cannot disable essential consent
        return;
      }

      const newConsents: ConsentState = {
        ...state.consents,
        [category]: granted,
      };

      const record: ConsentRecord = {
        consents: newConsents,
        version: requiredVersion,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      };

      saveConsentRecord(record);

      setState((prev) => ({
        ...prev,
        consents: newConsents,
        consentTimestamp: record.timestamp,
      }));

      if (onConsentChange) {
        onConsentChange(newConsents);
      }
    },
    [state.consents, requiredVersion, onConsentChange]
  );

  const revokeConsent = useCallback(
    (category: ConsentCategory) => {
      updateConsent(category, false);
    },
    [updateConsent]
  );

  const revokeAllConsents = useCallback(() => {
    const essentialOnly: ConsentState = {
      ...getDefaultConsents(),
      essential: true,
    };

    const record: ConsentRecord = {
      consents: essentialOnly,
      version: requiredVersion,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    saveConsentRecord(record);

    setState((prev) => ({
      ...prev,
      consents: essentialOnly,
      consentTimestamp: record.timestamp,
    }));

    if (onConsentChange) {
      onConsentChange(essentialOnly);
    }
  }, [requiredVersion, onConsentChange]);

  const hasConsent = useCallback(
    (category: ConsentCategory): boolean => {
      return state.consents[category] === true;
    },
    [state.consents]
  );

  // ============================================================================
  // Data Rights (GDPR)
  // ============================================================================

  const requestDataDeletion = useCallback(async () => {
    // Mark deletion request
    const deletionRecord = {
      userId: userId ?? 'anonymous',
      requestedAt: Date.now(),
      status: 'pending',
    };

    localStorage.setItem(STORAGE_KEY_DELETION, JSON.stringify(deletionRecord));

    setState((prev) => ({
      ...prev,
      dataDeletionRequested: true,
    }));

    if (onDataDeletionRequest) {
      onDataDeletionRequest();
    }

    // In production, this would trigger backend processes:
    // 1. Queue deletion job
    // 2. Notify data processors
    // 3. Generate deletion report
    // 4. Notify user when complete (30 days typically)
  }, [userId, onDataDeletionRequest]);

  const requestDataExport = useCallback(async (): Promise<DataExportData> => {
    const consentHistory = loadConsentHistory();

    // In production, gather all user data from various systems
    const exportData: DataExportData = {
      userId: userId ?? 'anonymous',
      consentHistory,
      dataCategories: {
        profile: {}, // Would fetch from backend
        messages: [],
        purchases: [],
        settings: {},
      },
      exportTimestamp: Date.now(),
      format: 'json',
    };

    if (onDataExportRequest) {
      onDataExportRequest();
    }

    // Trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petspark-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return exportData;
  }, [userId, onDataExportRequest]);

  // ============================================================================
  // Consent UI
  // ============================================================================

  const showConsentUI = useCallback(() => {
    // In production, this would trigger a modal/banner
    // For now, just a placeholder that would be implemented in UI layer
    const event = new CustomEvent('petspark:show-consent-ui', {
      detail: {
        requiredVersion,
        currentVersion: state.consentVersion,
        consents: state.consents,
      },
    });
    window.dispatchEvent(event);
  }, [requiredVersion, state.consentVersion, state.consents]);

  const getConsentDescription = useCallback((category: ConsentCategory): string => {
    return CONSENT_DESCRIPTIONS[category];
  }, []);

  const getConsentHistory = useCallback((): readonly ConsentRecord[] => {
    return loadConsentHistory();
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Show consent UI if needed
  useEffect(() => {
    if (!state.isConsentGiven || state.needsUpdate) {
      // Delay to avoid blocking initial render
      const timer = setTimeout(() => {
        showConsentUI();
      }, 1000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [state.isConsentGiven, state.needsUpdate, showConsentUI]);

  return {
    giveConsent,
    updateConsent,
    revokeConsent,
    revokeAllConsents,
    hasConsent,
    requestDataDeletion,
    requestDataExport,
    showConsentUI,
    getConsentDescription,
    getConsentHistory,
    state,
  };
}
