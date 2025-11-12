import * as ed from '@noble/ed25519'

/**
 * Key pair for ED25519 signing
 */
export interface KeyPair {
  privateKey: Uint8Array
  publicKey: Uint8Array
}

/**
 * Generate a new ED25519 key pair
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = await ed.getPublicKey(privateKey)

  return {
    privateKey,
    publicKey,
  }
}

/**
 * Encode private key to base64 string
 */
export function encodePrivateKey(privateKey: Uint8Array): string {
  return Buffer.from(privateKey).toString('base64')
}

/**
 * Encode public key to base64 string
 */
export function encodePublicKey(publicKey: Uint8Array): string {
  return Buffer.from(publicKey).toString('base64')
}

/**
 * Decode private key from base64 string
 */
export function decodePrivateKey(privateKeyBase64: string): Uint8Array {
  return Buffer.from(privateKeyBase64, 'base64')
}

/**
 * Decode public key from base64 string
 */
export function decodePublicKey(publicKeyBase64: string): Uint8Array {
  return Buffer.from(publicKeyBase64, 'base64')
}

/**
 * Load key pair from environment variables or generate new one
 */
export async function loadKeyPair(): Promise<KeyPair | undefined> {
  const privateKeyBase64 = process.env.SPEC_SIGNING_PRIVATE_KEY
  const publicKeyBase64 = process.env.SPEC_SIGNING_PUBLIC_KEY

  if (!privateKeyBase64 || !publicKeyBase64) {
    return undefined
  }

  try {
    const privateKey = decodePrivateKey(privateKeyBase64)
    const publicKey = decodePublicKey(publicKeyBase64)

    return {
      privateKey,
      publicKey,
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw new Error(`Failed to load key pair: ${err.message}`)
  }
}

/**
 * Validate key pair
 */
export async function validateKeyPair(keyPair: KeyPair): Promise<boolean> {
  try {
    const derivedPublicKey = await ed.getPublicKey(keyPair.privateKey)
    return Buffer.from(derivedPublicKey).equals(Buffer.from(keyPair.publicKey))
  } catch {
    return false
  }
}
