import { bytesToHex } from '@/lib/hex'

export type PasswordKdfDescriptor = {
  v: 1
  alg: 'scrypt'
  N: 32768
  r: 8
  p: 1
  dkLen: 32
  salt: string
}

export type PasswordKdfRequest = {
  password: string
  descriptor: PasswordKdfDescriptor
}

export type PasswordKdfResponse = { ok: true; hash: string } | { ok: false; error: string }

export const PASSWORD_KDF_STORAGE_KEY = 'adm-password-kdf'

const PASSWORD_KDF_PARAMETERS = Object.freeze({
  v: 1,
  alg: 'scrypt',
  N: 32768,
  r: 8,
  p: 1,
  dkLen: 32
} as const)

const SALT_LENGTH = 32
const SALT_HEX_PATTERN = /^[0-9a-f]{64}$/
const HASH_HEX_PATTERN = /^[0-9a-f]{64}$/

type KdfStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type PasswordKdfWorkerFactory = () => Worker
type PasswordKdfFallback = (
  password: string,
  descriptor: PasswordKdfDescriptor
) => string | Promise<string>

type PasswordKdfRuntimeOptions = {
  workerFactory?: PasswordKdfWorkerFactory
  fallback?: PasswordKdfFallback
  timeoutMs?: number
}

export const PASSWORD_KDF_WORKER_TIMEOUT_MS = 30_000

function getStorage(storage?: KdfStorage): KdfStorage {
  if (storage) return storage

  if (typeof window === 'undefined') {
    throw new Error('Password KDF storage is unavailable')
  }

  return window.localStorage
}

export function isPasswordKdfDescriptor(value: unknown): value is PasswordKdfDescriptor {
  if (!value || typeof value !== 'object') return false

  const descriptor = value as Partial<PasswordKdfDescriptor>

  return (
    descriptor.v === PASSWORD_KDF_PARAMETERS.v &&
    descriptor.alg === PASSWORD_KDF_PARAMETERS.alg &&
    descriptor.N === PASSWORD_KDF_PARAMETERS.N &&
    descriptor.r === PASSWORD_KDF_PARAMETERS.r &&
    descriptor.p === PASSWORD_KDF_PARAMETERS.p &&
    descriptor.dkLen === PASSWORD_KDF_PARAMETERS.dkLen &&
    typeof descriptor.salt === 'string' &&
    SALT_HEX_PATTERN.test(descriptor.salt)
  )
}

export function createPasswordKdfDescriptor(): PasswordKdfDescriptor {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure random number generation is unavailable')
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  return {
    ...PASSWORD_KDF_PARAMETERS,
    salt: bytesToHex(salt)
  }
}

export function loadPasswordKdfDescriptor(storage?: KdfStorage): PasswordKdfDescriptor | null {
  try {
    const serialized = getStorage(storage).getItem(PASSWORD_KDF_STORAGE_KEY)

    if (!serialized) return null

    const descriptor: unknown = JSON.parse(serialized)

    return isPasswordKdfDescriptor(descriptor) ? descriptor : null
  } catch {
    return null
  }
}

export function savePasswordKdfDescriptor(
  descriptor: PasswordKdfDescriptor,
  storage?: KdfStorage
): void {
  if (!isPasswordKdfDescriptor(descriptor)) {
    throw new Error('Invalid password KDF descriptor')
  }

  getStorage(storage).setItem(PASSWORD_KDF_STORAGE_KEY, JSON.stringify(descriptor))
}

export function clearPasswordKdfDescriptor(storage?: KdfStorage): void {
  getStorage(storage).removeItem(PASSWORD_KDF_STORAGE_KEY)
}

function createPasswordKdfWorker(): Worker {
  return new Worker(new URL('./passwordKdf.worker.ts', import.meta.url), { type: 'module' })
}

async function derivePasswordHashFallback(
  password: string,
  descriptor: PasswordKdfDescriptor
): Promise<string> {
  // Keep scrypt out of the main bundle unless the platform cannot start or complete the worker.
  const { derivePasswordHashSync } = await import('./passwordKdfCore')

  return derivePasswordHashSync(password, descriptor)
}

export function derivePasswordHash(
  password: string,
  descriptor: PasswordKdfDescriptor,
  {
    workerFactory = createPasswordKdfWorker,
    fallback = derivePasswordHashFallback,
    timeoutMs = PASSWORD_KDF_WORKER_TIMEOUT_MS
  }: PasswordKdfRuntimeOptions = {}
): Promise<string> {
  if (typeof password !== 'string') {
    return Promise.reject(new TypeError('Password must be a string'))
  }

  if (!isPasswordKdfDescriptor(descriptor)) {
    return Promise.reject(new Error('Invalid password KDF descriptor'))
  }

  return new Promise((resolve, reject) => {
    let worker: Worker | null = null
    let settled = false
    let timeout: ReturnType<typeof setTimeout> | undefined = undefined

    const terminateWorker = () => {
      if (timeout) clearTimeout(timeout)
      worker?.terminate()
      worker = null
    }

    const finish = (callback: () => void) => {
      if (settled) return

      settled = true
      terminateWorker()
      callback()
    }

    const useFallback = () => {
      if (settled) return

      settled = true
      terminateWorker()

      Promise.resolve()
        .then(() => fallback(password, descriptor))
        .then((hash) => {
          if (!HASH_HEX_PATTERN.test(hash)) {
            throw new Error('Password derivation fallback returned an invalid hash')
          }

          resolve(hash)
        })
        .catch(reject)
    }

    try {
      worker = workerFactory()
    } catch {
      useFallback()
      return
    }

    worker.onmessage = ({ data }: MessageEvent<PasswordKdfResponse>) => {
      if (data.ok && HASH_HEX_PATTERN.test(data.hash)) {
        finish(() => resolve(data.hash))
      } else {
        const message = data.ok ? 'Password derivation returned an invalid hash' : data.error
        finish(() => reject(new Error(message)))
      }
    }

    worker.onerror = (event) => {
      event.preventDefault()
      useFallback()
    }

    timeout = setTimeout(useFallback, timeoutMs)

    const request: PasswordKdfRequest = { password, descriptor }

    try {
      worker.postMessage(request)
    } catch {
      useFallback()
    }
  })
}
