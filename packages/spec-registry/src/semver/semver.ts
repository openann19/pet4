import semver from 'semver'

/**
 * Validate semver version
 */
export function validateSemverVersion(version: string): boolean {
  return semver.valid(version) !== null
}

/**
 * Compare two versions
 */
export function compareVersions(v1: string, v2: string): number {
  return semver.compare(v1, v2)
}

/**
 * Check if version satisfies range
 */
export function satisfiesVersion(version: string, range: string): boolean {
  return semver.satisfies(version, range)
}

/**
 * Get next version based on semver rules
 */
export function getNextVersion(
  currentVersion: string,
  type: 'major' | 'minor' | 'patch'
): string {
  return semver.inc(currentVersion, type) ?? currentVersion
}

/**
 * Check if version change is allowed based on semver rules
 */
export function isVersionChangeAllowed(
  currentVersion: string,
  newVersion: string,
  rules?: {
    major?: string[]
    minor?: string[]
    patch?: string[]
  }
): boolean {
  if (!semver.valid(currentVersion) || !semver.valid(newVersion)) {
    return false
  }

  const diff = semver.diff(currentVersion, newVersion)

  if (!diff) {
    return currentVersion === newVersion
  }

  if (diff === 'major' && rules?.major) {
    return rules.major.includes('allow')
  }

  if (diff === 'minor' && rules?.minor) {
    return rules.minor.includes('allow')
  }

  if (diff === 'patch' && rules?.patch) {
    return rules.patch.includes('allow')
  }

  return true
}
