import { createHash } from 'crypto'
import type {
  Pack,
  PackConfiguration,
  MergedSpec,
} from '../schemas/pack-schema.js'
import { validatePack } from '../validation/validator.js'

/**
 * Compute SHA-256 hash of pack content
 */
export function computePackHash(pack: Pack): string {
  const content = JSON.stringify(pack, Object.keys(pack).sort())
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Compute SHA-256 hash of merged spec
 */
export function computeMergedSpecHash(spec: MergedSpec): string {
  const content = JSON.stringify(spec, Object.keys(spec).sort())
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Deep merge two objects, with later values taking precedence
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target }

  for (const key in source) {
    const sourceValue = source[key]
    const targetValue = result[key]

    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== undefined &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>]
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[Extract<keyof T, string>]
    }
  }

  return result
}

/**
 * Merge environment variables from multiple packs
 */
function mergeEnv(
  envs: Array<Record<string, string> | undefined>
): Record<string, string> {
  const merged: Record<string, string> = {}

  for (const env of envs) {
    if (env) {
      Object.assign(merged, env)
    }
  }

  return merged
}

/**
 * Merge feature flags from multiple packs
 */
function mergeFeatureFlags(
  flags: Array<Record<string, boolean> | undefined>
): Record<string, boolean> {
  const merged: Record<string, boolean> = {}

  for (const flagSet of flags) {
    if (flagSet) {
      Object.assign(merged, flagSet)
    }
  }

  return merged
}

/**
 * Merge compliance settings from multiple packs
 */
function mergeCompliance(
  compliances: Array<
    | {
        hipaa?: boolean
        pci?: boolean
        gdpr?: boolean
        certifications?: string[]
      }
    | undefined
  >
): {
  hipaa?: boolean
  pci?: boolean
  gdpr?: boolean
  certifications?: string[]
} {
  const merged: {
    hipaa?: boolean
    pci?: boolean
    gdpr?: boolean
    certifications?: string[]
  } = {}

  const certificationsSet = new Set<string>()

  for (const compliance of compliances) {
    if (compliance) {
      if (compliance.hipaa !== undefined) {
        merged.hipaa = (merged.hipaa ?? false) || compliance.hipaa
      }
      if (compliance.pci !== undefined) {
        merged.pci = (merged.pci ?? false) || compliance.pci
      }
      if (compliance.gdpr !== undefined) {
        merged.gdpr = (merged.gdpr ?? false) || compliance.gdpr
      }
      if (compliance.certifications) {
        for (const cert of compliance.certifications) {
          certificationsSet.add(cert)
        }
      }
    }
  }

  if (certificationsSet.size > 0) {
    merged.certifications = Array.from(certificationsSet).sort()
  }

  return merged
}

/**
 * Merge credentials from multiple packs
 */
function mergeCredentials(
  credentials: Array<
    | {
        required?: string[]
        optional?: string[]
        prompts?: Array<{
          key: string
          label: string
          description?: string
          type?: 'string' | 'password' | 'file'
          required?: boolean
        }>
      }
    | undefined
  >
): {
  required?: string[]
  optional?: string[]
  prompts?: Array<{
    key: string
    label: string
    description?: string
    type?: 'string' | 'password' | 'file'
    required?: boolean
  }>
} {
  const merged: {
    required?: string[]
    optional?: string[]
    prompts?: Array<{
      key: string
      label: string
      description?: string
      type?: 'string' | 'password' | 'file'
      required?: boolean
    }>
  } = {}

  const requiredSet = new Set<string>()
  const optionalSet = new Set<string>()
  const promptsMap = new Map<
    string,
    {
      key: string
      label: string
      description?: string
      type?: 'string' | 'password' | 'file'
      required?: boolean
    }
  >()

  for (const cred of credentials) {
    if (cred) {
      if (cred.required) {
        for (const req of cred.required) {
          requiredSet.add(req)
        }
      }
      if (cred.optional) {
        for (const opt of cred.optional) {
          optionalSet.add(opt)
        }
      }
      if (cred.prompts) {
        for (const prompt of cred.prompts) {
          promptsMap.set(prompt.key, prompt)
        }
      }
    }
  }

  if (requiredSet.size > 0) {
    merged.required = Array.from(requiredSet).sort()
  }
  if (optionalSet.size > 0) {
    merged.optional = Array.from(optionalSet).sort()
  }
  if (promptsMap.size > 0) {
    merged.prompts = Array.from(promptsMap.values())
  }

  return merged
}

/**
 * Merge budgets from multiple packs (take maximum values)
 */
function mergeBudgets(
  budgets: Array<
    | {
        bundleSize?: number
        lighthouse?: {
          performance?: number
          accessibility?: number
          bestPractices?: number
          seo?: number
        }
      }
    | undefined
  >
): {
  bundleSize?: number
  lighthouse?: {
    performance?: number
    accessibility?: number
    bestPractices?: number
    seo?: number
  }
} {
  const merged: {
    bundleSize?: number
    lighthouse?: {
      performance?: number
      accessibility?: number
      bestPractices?: number
      seo?: number
    }
  } = {}

  let maxBundleSize: number | undefined

  const lighthouse: {
    performance?: number
    accessibility?: number
    bestPractices?: number
    seo?: number
  } = {}

  for (const budget of budgets) {
    if (budget) {
      if (budget.bundleSize !== undefined) {
        maxBundleSize =
          maxBundleSize === undefined
            ? budget.bundleSize
            : Math.max(maxBundleSize, budget.bundleSize)
      }
      if (budget.lighthouse) {
        if (budget.lighthouse.performance !== undefined) {
          lighthouse.performance =
            lighthouse.performance === undefined
              ? budget.lighthouse.performance
              : Math.max(lighthouse.performance, budget.lighthouse.performance)
        }
        if (budget.lighthouse.accessibility !== undefined) {
          lighthouse.accessibility =
            lighthouse.accessibility === undefined
              ? budget.lighthouse.accessibility
              : Math.max(lighthouse.accessibility, budget.lighthouse.accessibility)
        }
        if (budget.lighthouse.bestPractices !== undefined) {
          lighthouse.bestPractices =
            lighthouse.bestPractices === undefined
              ? budget.lighthouse.bestPractices
              : Math.max(lighthouse.bestPractices, budget.lighthouse.bestPractices)
        }
        if (budget.lighthouse.seo !== undefined) {
          lighthouse.seo =
            lighthouse.seo === undefined
              ? budget.lighthouse.seo
              : Math.max(lighthouse.seo, budget.lighthouse.seo)
        }
      }
    }
  }

  if (maxBundleSize !== undefined) {
    merged.bundleSize = maxBundleSize
  }
  if (Object.keys(lighthouse).length > 0) {
    merged.lighthouse = lighthouse
  }

  return merged
}

/**
 * Merge outputs from multiple packs (deep merge)
 */
function mergeOutputs(
  outputs: Array<Record<string, unknown> | undefined>
): Record<string, unknown> {
  let merged: Record<string, unknown> = {}

  for (const output of outputs) {
    if (output) {
      merged = deepMerge(merged, output)
    }
  }

  return merged
}

/**
 * Merge configuration from multiple packs
 */
function mergeConfiguration(configs: Array<PackConfiguration | undefined>): PackConfiguration {
  const merged: PackConfiguration = {}

  const envs = configs.map((c) => c?.env)
  const featureFlags = configs.map((c) => c?.featureFlags)
  const compliances = configs.map((c) => c?.compliance)
  const credentials = configs.map((c) => c?.credentials)
  const budgets = configs.map((c) => c?.budgets)
  const outputs = configs.map((c) => c?.outputs)

  const mergedEnv = mergeEnv(envs)
  if (Object.keys(mergedEnv).length > 0) {
    merged.env = mergedEnv
  }

  const mergedFeatureFlags = mergeFeatureFlags(featureFlags)
  if (Object.keys(mergedFeatureFlags).length > 0) {
    merged.featureFlags = mergedFeatureFlags
  }

  const mergedCompliance = mergeCompliance(compliances)
  if (Object.keys(mergedCompliance).length > 0) {
    merged.compliance = mergedCompliance
  }

  const mergedCredentials = mergeCredentials(credentials)
  if (Object.keys(mergedCredentials).length > 0) {
    merged.credentials = mergedCredentials
  }

  const mergedBudgets = mergeBudgets(budgets)
  if (Object.keys(mergedBudgets).length > 0) {
    merged.budgets = mergedBudgets
  }

  const mergedOutputs = mergeOutputs(outputs)
  if (Object.keys(mergedOutputs).length > 0) {
    merged.outputs = mergedOutputs
  }

  return merged
}

/**
 * Merge multiple packs into a single merged spec
 */
export function mergePacks(packs: Pack[], startTime?: number): MergedSpec {
  if (packs.length === 0) {
    throw new Error('Cannot merge empty pack array')
  }

  const mergedAt = new Date().toISOString()
  const mergeStartTime = startTime ?? Date.now()

  const validatedPacks: Pack[] = []
  const packEntries: Array<{
    packId: string
    version: string
    hash: string
  }> = []

  for (const pack of packs) {
    const validated = validatePack(pack)
    validatedPacks.push(validated)

    const hash = computePackHash(validated)
    packEntries.push({
      packId: validated.metadata.packId,
      version: validated.metadata.version,
      hash,
    })
  }

  const configurations = validatedPacks.map((p) => p.configuration)
  const mergedConfiguration = mergeConfiguration(configurations)

  const mergeDuration = Date.now() - mergeStartTime

  const mergedSpec: MergedSpec = {
    version: '1.0.0',
    mergedAt,
    packs: packEntries.sort((a, b) => a.packId.localeCompare(b.packId)),
    configuration: mergedConfiguration,
    metadata: {
      totalPacks: packs.length,
      mergeDuration,
    },
  }

  const hash = computeMergedSpecHash(mergedSpec)
  mergedSpec.metadata.hash = hash

  return mergedSpec
}
