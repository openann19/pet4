import { z } from 'zod'

/**
 * Pack metadata schema
 */
export const PackMetadataSchema = z.object({
  packId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export type PackMetadata = z.infer<typeof PackMetadataSchema>

/**
 * Pack dependency schema
 */
export const PackDependencySchema = z.object({
  packId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  source: z.enum(['local', 'remote', 'registry']).optional(),
  url: z.string().url().optional(),
  hash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
})

export type PackDependency = z.infer<typeof PackDependencySchema>

/**
 * Pack configuration schema
 */
export const PackConfigurationSchema = z.object({
  env: z.record(z.string(), z.string()).optional(),
  featureFlags: z.record(z.string(), z.boolean()).optional(),
  compliance: z
    .object({
      hipaa: z.boolean().optional(),
      pci: z.boolean().optional(),
      gdpr: z.boolean().optional(),
      certifications: z.array(z.string()).optional(),
    })
    .optional(),
  credentials: z
    .object({
      required: z.array(z.string()).optional(),
      optional: z.array(z.string()).optional(),
      prompts: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            description: z.string().optional(),
            type: z.enum(['string', 'password', 'file']).optional(),
            required: z.boolean().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  budgets: z
    .object({
      bundleSize: z.number().optional(),
      lighthouse: z
        .object({
          performance: z.number().optional(),
          accessibility: z.number().optional(),
          bestPractices: z.number().optional(),
          seo: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  outputs: z
    .object({
      pwaManifest: z.record(z.unknown()).optional(),
      expoConfig: z.record(z.unknown()).optional(),
      webpackConfig: z.record(z.unknown()).optional(),
    })
    .optional(),
})

export type PackConfiguration = z.infer<typeof PackConfigurationSchema>

/**
 * Pack schema - complete pack definition
 */
export const PackSchema = z.object({
  metadata: PackMetadataSchema,
  dependencies: z.array(PackDependencySchema).optional(),
  configuration: PackConfigurationSchema.optional(),
})

export type Pack = z.infer<typeof PackSchema>

/**
 * Merged spec schema - result of merging multiple packs
 */
export const MergedSpecSchema = z.object({
  version: z.literal('1.0.0'),
  mergedAt: z.string().datetime(),
  packs: z.array(
    z.object({
      packId: z.string(),
      version: z.string(),
      hash: z.string().regex(/^[a-f0-9]{64}$/),
    })
  ),
  configuration: PackConfigurationSchema,
  metadata: z.object({
    totalPacks: z.number(),
    mergeDuration: z.number().optional(),
    hash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  }),
})

export type MergedSpec = z.infer<typeof MergedSpecSchema>

/**
 * Lock file schema - includes signatures and provenance
 */
export const LockFileSchema = z.object({
  version: z.literal('1.0.0'),
  lockedAt: z.string().datetime(),
  mergedSpec: MergedSpecSchema,
  signatures: z.array(
    z.object({
      packId: z.string(),
      signature: z.string(),
      publicKey: z.string(),
      algorithm: z.literal('ed25519'),
    })
  ).optional(),
  provenance: z
    .object({
      issuedBy: z.string(),
      reviewedAt: z.string().datetime().optional(),
      checksums: z.record(z.string(), z.string()),
    })
    .optional(),
})

export type LockFile = z.infer<typeof LockFileSchema>
