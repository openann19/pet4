/**
 * Store Submission Helpers
 * 
 * Utilities for preparing App Store and Google Play submissions:
 * - Metadata generation (EN + BG)
 * - Asset validation
 * - Compliance checking
 * - Version management
 */


export interface StoreMetadata {
  appName: {
    en: string
    bg: string
  }
  subtitle?: {
    en: string
    bg: string
  }
  description: {
    en: string
    bg: string
  }
  shortDescription: {
    en: string
    bg: string
  }
  keywords: {
    en: string[]
    bg: string[]
  }
  promotionalText?: {
    en: string
    bg: string
  }
  supportUrl: string
  marketingUrl?: string
  privacyPolicyUrl: string
}

export interface AppVersion {
  version: string
  buildNumber: number
  releaseNotes: {
    en: string
    bg: string
  }
}

export interface StoreAssets {
  icon: {
    path: string
    sizes: Array<{ width: number; height: number }>
  }
  screenshots: {
    phone: {
      en: string[]
      bg: string[]
    }
    tablet?: {
      en: string[]
      bg: string[]
    }
  }
  appPreview?: {
    en: string
    bg: string
  }
}

export interface PrivacyInfo {
  dataTypes: Array<{
    type: string
    purpose: string[]
    linked: boolean
    tracking: boolean
    usedForAds: boolean
  }>
  tracking: boolean
  trackingDomains?: string[]
}

const DEFAULT_METADATA: StoreMetadata = {
  appName: {
    en: 'PawfectMatch',
    bg: 'PawfectMatch'
  },
  description: {
    en: 'Find perfect companions for your pets with AI-powered matching. Connect with pet owners, discover compatible matches, and build lasting friendships.',
    bg: 'Намерете перфектни спътници за вашите домашни любимци с AI-управлявано съвпадение. Свържете се с собственици на домашни любимци, открийте съвместими съвпадения и изградете трайни приятелства.'
  },
  shortDescription: {
    en: 'AI-powered pet companion matching app',
    bg: 'Приложение за AI-управлявано съвпадение на домашни любимци'
  },
  keywords: {
    en: ['pets', 'dogs', 'cats', 'matching', 'social', 'community'],
    bg: ['домашни любимци', 'кучета', 'котки', 'съвпадение', 'социални', 'общност']
  },
  supportUrl: 'https://pawfectmatch.app/support',
  privacyPolicyUrl: 'https://pawfectmatch.app/privacy'
}

export class StoreSubmissionHelper {
  private metadata: StoreMetadata
  private version: AppVersion
  private assets: StoreAssets
  private privacyInfo: PrivacyInfo

  constructor(config: {
    metadata?: Partial<StoreMetadata>
    version: AppVersion
    assets: StoreAssets
    privacyInfo: PrivacyInfo
  }) {
    this.metadata = { ...DEFAULT_METADATA, ...config.metadata }
    this.version = config.version
    this.assets = config.assets
    this.privacyInfo = config.privacyInfo
  }

  /**
   * Generate App Store Connect metadata JSON
   */
  generateAppStoreMetadata(): Record<string, unknown> {
    return {
      version: this.version.version,
      build: this.version.buildNumber,
      'en-US': {
        name: this.metadata.appName.en,
        subtitle: this.metadata.subtitle?.en,
        description: this.metadata.description.en,
        keywords: this.metadata.keywords.en.join(','),
        promotionalText: this.metadata.promotionalText?.en,
        releaseNotes: this.version.releaseNotes.en,
        supportUrl: this.metadata.supportUrl,
        marketingUrl: this.metadata.marketingUrl,
        privacyPolicyUrl: this.metadata.privacyPolicyUrl
      },
      'bg': {
        name: this.metadata.appName.bg,
        subtitle: this.metadata.subtitle?.bg,
        description: this.metadata.description.bg,
        keywords: this.metadata.keywords.bg.join(','),
        promotionalText: this.metadata.promotionalText?.bg,
        releaseNotes: this.version.releaseNotes.bg,
        supportUrl: this.metadata.supportUrl,
        marketingUrl: this.metadata.marketingUrl,
        privacyPolicyUrl: this.metadata.privacyPolicyUrl
      }
    }
  }

  /**
   * Generate Google Play Console metadata JSON
   */
  generatePlayStoreMetadata(): Record<string, unknown> {
    return {
      version: this.version.version,
      versionCode: this.version.buildNumber,
      defaultLanguage: 'en-US',
      'en-US': {
        title: this.metadata.appName.en,
        shortDescription: this.metadata.shortDescription.en,
        fullDescription: this.metadata.description.en,
        recentChanges: this.version.releaseNotes.en
      },
      bg: {
        title: this.metadata.appName.bg,
        shortDescription: this.metadata.shortDescription.bg,
        fullDescription: this.metadata.description.bg,
        recentChanges: this.version.releaseNotes.bg
      }
    }
  }

  /**
   * Generate App Store privacy nutrition labels
   */
  generatePrivacyLabels(): Record<string, unknown> {
    return {
      dataTypes: this.privacyInfo.dataTypes.map((dt) => ({
        type: dt.type,
        purpose: dt.purpose,
        linked: dt.linked,
        tracking: dt.tracking,
        usedForAds: dt.usedForAds
      })),
      tracking: this.privacyInfo.tracking,
      trackingDomains: this.privacyInfo.trackingDomains || []
    }
  }

  /**
   * Generate Google Play Data Safety form data
   */
  generateDataSafetyForm(): Record<string, unknown> {
    return {
      dataCollection: this.privacyInfo.dataTypes.length > 0,
      dataTypes: this.privacyInfo.dataTypes.map((dt) => ({
        type: dt.type,
        purpose: dt.purpose,
        shared: dt.linked,
        collected: true
      })),
      securityPractices: {
        encryption: true,
        dataDeletion: true
      }
    }
  }

  /**
   * Validate store assets
   */
  validateAssets(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate icon
    if (!this.assets.icon.path) {
      errors.push('Icon path is required')
    }

    // Validate screenshots
    if (!this.assets.screenshots.phone.en || this.assets.screenshots.phone.en.length === 0) {
      errors.push('Phone screenshots (EN) are required')
    }

    if (!this.assets.screenshots.phone.bg || this.assets.screenshots.phone.bg.length === 0) {
      errors.push('Phone screenshots (BG) are required')
    }

    // Validate screenshot count (minimum 2, maximum 10)
    if (this.assets.screenshots.phone.en.length < 2) {
      errors.push('Minimum 2 phone screenshots (EN) required')
    }

    if (this.assets.screenshots.phone.en.length > 10) {
      errors.push('Maximum 10 phone screenshots (EN) allowed')
    }

    if (this.assets.screenshots.phone.bg.length < 2) {
      errors.push('Minimum 2 phone screenshots (BG) required')
    }

    if (this.assets.screenshots.phone.bg.length > 10) {
      errors.push('Maximum 10 phone screenshots (BG) allowed')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate version format (SemVer)
   */
  validateVersion(): { valid: boolean; error?: string } {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?(\+[a-zA-Z0-9]+)?$/
    
    if (!semverRegex.test(this.version.version)) {
      return {
        valid: false,
        error: `Invalid version format: ${String(this.version.version ?? '')}. Expected SemVer (e.g., 1.0.0)`
      }
    }

    if (this.version.buildNumber <= 0) {
      return {
        valid: false,
        error: 'Build number must be greater than 0'
      }
    }

    return { valid: true }
  }

  /**
   * Generate submission checklist
   */
  generateChecklist(): {
    category: string
    items: Array<{ item: string; status: 'pending' | 'complete' | 'error' }>
  }[] {
    const assetValidation = this.validateAssets()
    const versionValidation = this.validateVersion()

    return [
      {
        category: 'Metadata',
        items: [
          { item: 'App name (EN)', status: 'complete' },
          { item: 'App name (BG)', status: 'complete' },
          { item: 'Description (EN)', status: 'complete' },
          { item: 'Description (BG)', status: 'complete' },
          { item: 'Privacy policy URL', status: this.metadata.privacyPolicyUrl ? 'complete' : 'pending' }
        ]
      },
      {
        category: 'Assets',
        items: [
          { item: 'App icon', status: this.assets.icon.path ? 'complete' : 'pending' },
          { item: 'Phone screenshots (EN)', status: this.assets.screenshots.phone.en.length >= 2 ? 'complete' : 'pending' },
          { item: 'Phone screenshots (BG)', status: this.assets.screenshots.phone.bg.length >= 2 ? 'complete' : 'pending' },
          { item: 'Asset validation', status: assetValidation.valid ? 'complete' : 'error' }
        ]
      },
      {
        category: 'Version',
        items: [
          { item: 'Version format', status: versionValidation.valid ? 'complete' : 'error' },
          { item: 'Build number', status: this.version.buildNumber > 0 ? 'complete' : 'error' },
          { item: 'Release notes (EN)', status: this.version.releaseNotes.en ? 'complete' : 'pending' },
          { item: 'Release notes (BG)', status: this.version.releaseNotes.bg ? 'complete' : 'pending' }
        ]
      },
      {
        category: 'Privacy',
        items: [
          { item: 'Privacy info defined', status: this.privacyInfo.dataTypes.length > 0 ? 'complete' : 'pending' },
          { item: 'Tracking declared', status: 'complete' }
        ]
      }
    ]
  }

  /**
   * Export all metadata and assets info
   */
  exportSubmissionPackage(): Record<string, unknown> {
    return {
      metadata: {
        appStore: this.generateAppStoreMetadata(),
        playStore: this.generatePlayStoreMetadata()
      },
      privacy: {
        appStore: this.generatePrivacyLabels(),
        playStore: this.generateDataSafetyForm()
      },
      assets: this.assets,
      version: this.version,
      checklist: this.generateChecklist(),
      validation: {
        assets: this.validateAssets(),
        version: this.validateVersion()
      }
    }
  }
}

/**
 * Parse SemVer version string
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number; prerelease?: string; build?: string } | null {
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9]+))?(?:\+([a-zA-Z0-9]+))?$/
  const match = version.match(regex)

  if (!match) {
    return null
  }

  return {
    major: parseInt(match[1] ?? '0', 10),
    minor: parseInt(match[2] ?? '0', 10),
    patch: parseInt(match[3] ?? '0', 10),
    ...(match[4] && { prerelease: match[4] }),
    ...(match[5] && { build: match[5] })
  }
}

/**
 * Increment version
 */
export function incrementVersion(
  currentVersion: string,
  type: 'major' | 'minor' | 'patch'
): string | null {
  const parsed = parseVersion(currentVersion)
  if (!parsed) {
    return null
  }

  switch (type) {
    case 'major':
      return `${String(parsed.major + 1 ?? '')}.0.0`
    case 'minor':
      return `${String(parsed.major ?? '')}.${String(parsed.minor + 1 ?? '')}.0`
    case 'patch':
      return `${String(parsed.major ?? '')}.${String(parsed.minor ?? '')}.${String(parsed.patch + 1 ?? '')}`
  }
}
