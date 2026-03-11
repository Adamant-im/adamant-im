/**
 * Crypto utilities for Service Worker
 * AES-GCM encryption with PBKDF2 key derivation
 * Compatible with importScripts()
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM'
const KEY_DERIVATION_ALGORITHM = 'PBKDF2'
const ITERATIONS = 100000

/**
 * Converts hex string to Uint8Array
 */
function hexToBytes(hexString) {
  const bytes = []
  for (let c = 0; c < hexString.length; c += 2) {
    bytes.push(parseInt(hexString.substr(c, 2), 16))
  }
  return Uint8Array.from(bytes)
}

/**
 * Derives encryption key from password using PBKDF2
 */
async function deriveEncryptionKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    typeof password === 'string' ? hexToBytes(password) : password,
    { name: KEY_DERIVATION_ALGORITHM },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_ALGORITHM,
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Decrypts data with password
 */
async function decryptData(encryptedBase64, saltBase64, ivBase64, password) {
  try {
    const encrypted = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0))
    const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0))
    const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0))

    const key = await deriveEncryptionKey(password, salt)

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      encrypted
    )

    const dec = new TextDecoder()
    return dec.decode(decrypted)
  } catch (error) {
    console.error('[SW Crypto] Decryption failed:', error)
    throw new Error('Failed to decrypt private key')
  }
}

async function encryptData(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveEncryptionKey(password, salt)
  const toBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  return { encrypted: toBase64(encrypted), salt: toBase64(salt), iv: toBase64(iv) }
}

self.encryptData = encryptData

self.decryptData = decryptData
self.hexToBytes = hexToBytes
