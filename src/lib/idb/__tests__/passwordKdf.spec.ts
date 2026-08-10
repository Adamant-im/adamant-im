import { describe, expect, it, vi } from 'vitest'

import {
  PASSWORD_KDF_WORKER_TIMEOUT_MS,
  PASSWORD_KDF_STORAGE_KEY,
  clearPasswordKdfDescriptor,
  createPasswordKdfDescriptor,
  derivePasswordHash,
  isPasswordKdfDescriptor,
  loadPasswordKdfDescriptor,
  savePasswordKdfDescriptor,
  type PasswordKdfDescriptor
} from '../passwordKdf'
import { derivePasswordHashSync } from '../passwordKdfCore'

const ZERO_SALT_DESCRIPTOR: PasswordKdfDescriptor = {
  v: 1,
  alg: 'scrypt',
  N: 32768,
  r: 8,
  p: 1,
  dkLen: 32,
  salt: '00'.repeat(32)
}

function createStorage() {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  }
}

function createWorker(response: unknown) {
  const worker = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: ErrorEvent) => void) | null,
    postMessage: vi.fn(function (this: typeof worker) {
      queueMicrotask(() => this.onmessage?.({ data: response } as MessageEvent))
    }),
    terminate: vi.fn()
  }

  return worker
}

describe('password KDF', () => {
  it('creates independent versioned descriptors with CSPRNG salts', () => {
    const first = createPasswordKdfDescriptor()
    const second = createPasswordKdfDescriptor()

    expect(first).toMatchObject({ v: 1, alg: 'scrypt', N: 32768, r: 8, p: 1, dkLen: 32 })
    expect(first.salt).toMatch(/^[0-9a-f]{64}$/)
    expect(second.salt).not.toBe(first.salt)
  })

  it('matches the production scrypt vector', () => {
    expect(derivePasswordHashSync('correct horse battery staple', ZERO_SALT_DESCRIPTOR)).toBe(
      '0e1881f66d99cf326bb0bc8405364cfac55cfc7bec10900aafee23fb379df8e2'
    )
  })

  it('derives different hashes for different salts', () => {
    const otherDescriptor = { ...ZERO_SALT_DESCRIPTOR, salt: '01'.repeat(32) }

    expect(derivePasswordHashSync('same password', ZERO_SALT_DESCRIPTOR)).not.toBe(
      derivePasswordHashSync('same password', otherDescriptor)
    )
  })

  it('rejects descriptors with attacker-controlled work factors', () => {
    expect(isPasswordKdfDescriptor({ ...ZERO_SALT_DESCRIPTOR, N: 2 ** 20 })).toBe(false)
    expect(isPasswordKdfDescriptor({ ...ZERO_SALT_DESCRIPTOR, salt: 'not-hex' })).toBe(false)
  })

  it('stores and clears only a validated descriptor', () => {
    const storage = createStorage()

    savePasswordKdfDescriptor(ZERO_SALT_DESCRIPTOR, storage)
    expect(loadPasswordKdfDescriptor(storage)).toEqual(ZERO_SALT_DESCRIPTOR)

    clearPasswordKdfDescriptor(storage)
    expect(storage.getItem(PASSWORD_KDF_STORAGE_KEY)).toBeNull()
  })

  it('treats malformed persisted data as unavailable', () => {
    const storage = createStorage()
    storage.setItem(PASSWORD_KDF_STORAGE_KEY, '{broken')

    expect(loadPasswordKdfDescriptor(storage)).toBeNull()
  })

  it('terminates its worker after a successful derivation', async () => {
    const hash = 'ab'.repeat(32)
    const worker = createWorker({ ok: true, hash })

    await expect(
      derivePasswordHash('password', ZERO_SALT_DESCRIPTOR, {
        workerFactory: () => worker as unknown as Worker
      })
    ).resolves.toBe(hash)
    expect(worker.postMessage).toHaveBeenCalledWith({
      password: 'password',
      descriptor: ZERO_SALT_DESCRIPTOR
    })
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('terminates its worker after a derivation error', async () => {
    const worker = createWorker({ ok: false, error: 'scrypt failed' })

    await expect(
      derivePasswordHash('password', ZERO_SALT_DESCRIPTOR, {
        workerFactory: () => worker as unknown as Worker
      })
    ).rejects.toThrow('scrypt failed')
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('uses the same KDF fallback when the worker cannot be created', async () => {
    const fallback = vi.fn().mockReturnValue('cd'.repeat(32))

    await expect(
      derivePasswordHash('password', ZERO_SALT_DESCRIPTOR, {
        workerFactory: () => {
          throw new Error('Worker is unavailable')
        },
        fallback
      })
    ).resolves.toBe('cd'.repeat(32))
    expect(fallback).toHaveBeenCalledWith('password', ZERO_SALT_DESCRIPTOR)
  })

  it('terminates an unresponsive worker and falls back after the timeout', async () => {
    vi.useFakeTimers()
    const worker = createWorker({ ok: true, hash: 'ef'.repeat(32) })
    worker.postMessage.mockImplementation(() => undefined)
    const fallback = vi.fn().mockReturnValue('ef'.repeat(32))

    const hashPromise = derivePasswordHash('password', ZERO_SALT_DESCRIPTOR, {
      workerFactory: () => worker as unknown as Worker,
      fallback
    })

    await vi.advanceTimersByTimeAsync(PASSWORD_KDF_WORKER_TIMEOUT_MS)
    await expect(hashPromise).resolves.toBe('ef'.repeat(32))
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(fallback).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('uses the fallback after a worker runtime error', async () => {
    const worker = createWorker(null)
    worker.postMessage.mockImplementation(function (this: typeof worker) {
      queueMicrotask(() =>
        this.onerror?.({
          preventDefault: vi.fn(),
          message: 'Worker failed'
        } as unknown as ErrorEvent)
      )
    })
    const fallback = vi.fn().mockReturnValue('12'.repeat(32))

    await expect(
      derivePasswordHash('password', ZERO_SALT_DESCRIPTOR, {
        workerFactory: () => worker as unknown as Worker,
        fallback
      })
    ).resolves.toBe('12'.repeat(32))
    expect(worker.terminate).toHaveBeenCalledOnce()
  })
})
