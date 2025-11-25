import * as ed from '@noble/ed25519'
import type { KeyPair } from './key-manager.js'
import { encodePublicKey } from './key-manager.js'

/**
 * Signature with metadata
 */
export interface Signature {
  signature: string
  publicKey: string
  algorithm: 'ed25519'
  timestamp: string
}

/**
 * Sign data with ED25519 private key
 */
export function signData(data: string | Uint8Array, keyPair: KeyPair): Promise<Signature> {
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const signature = ed.sign(dataBytes, keyPair.privateKey)

  return Promise.resolve({
    signature: Buffer.from(signature).toString('base64'),
    publicKey: encodePublicKey(keyPair.publicKey),
    algorithm: 'ed25519',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Verify signature with ED25519 public key
 */
export function verifySignature(
  data: string | Uint8Array,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
    const signatureBytes = Buffer.from(signature, 'base64')
    const publicKeyBytes = Buffer.from(publicKey, 'base64')

    return Promise.resolve(ed.verify(signatureBytes, dataBytes, publicKeyBytes))
  } catch {
    return Promise.resolve(false)
  }
}

/**
 * Sign lock file content
 */
export function signLockFile(lockFileContent: string, keyPair: KeyPair): Promise<Signature> {
  return signData(lockFileContent, keyPair)
}

/**
 * Verify lock file signature
 */
export function verifyLockFileSignature(
  lockFileContent: string,
  signature: Signature
): Promise<boolean> {
  return verifySignature(lockFileContent, signature.signature, signature.publicKey)
}
