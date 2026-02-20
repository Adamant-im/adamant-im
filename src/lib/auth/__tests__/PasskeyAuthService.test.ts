import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { PasskeyAuthService } from '../PasskeyAuthService'
import { AuthenticationResult, SetupResult } from '../types'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn()
  }
}))

vi.mock('@/store', () => ({
  default: {
    state: {
      address: 'U12345678901234567890'
    }
  }
}))

const mockCrypto = {
  getRandomValues: vi.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  })
}

const mockCredentials = {
  create: vi.fn(),
  get: vi.fn()
}

describe('PasskeyAuthService', () => {
  let service: PasskeyAuthService
  const mockCapacitor = vi.mocked(Capacitor)

  beforeEach(() => {
    service = new PasskeyAuthService()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true
    })

    Object.defineProperty(global, 'window', {
      value: {
        location: { hostname: 'localhost' },
        PublicKeyCredential: class {},
      },
      writable: true
    })

    Object.defineProperty(global, 'navigator', {
      value: {
        credentials: mockCredentials
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('authorizeUser', () => {
    it('should return Failed when on native platform', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true)

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Failed)
    })

    it('should return Failed when WebAuthn is not supported', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      delete (global.navigator as any).credentials

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Failed)
    })

    it('should return Success when passkey authentication succeeds', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      mockCredentials.get.mockResolvedValue({ id: 'credential-id' })

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Success)
      expect(mockCredentials.get).toHaveBeenCalledWith({
        publicKey: {
          challenge: expect.any(Uint8Array),
          rpId: 'localhost',
          userVerification: 'preferred',
          timeout: 30000
        }
      })
    })

    it('should return Cancel when user cancels authentication', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      const cancelError = new Error('User cancelled')
      cancelError.name = 'NotAllowedError'
      mockCredentials.get.mockRejectedValue(cancelError)

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Cancel)
    })

    it('should return Cancel when authentication is aborted', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      const abortError = new Error('Operation aborted')
      abortError.name = 'AbortError'
      mockCredentials.get.mockRejectedValue(abortError)

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Cancel)
    })

    it('should return Failed when authentication fails', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      const authError = new Error('Authentication failed')
      authError.name = 'SecurityError'
      mockCredentials.get.mockRejectedValue(authError)

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Failed)
    })
  })

  describe('setupPasskey', () => {
    it('should return Failed when on native platform', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true)

      const result = await service.setupPasskey()

      expect(result).toBe(SetupResult.Failed)
    })

    it('should return Failed when WebAuthn is not supported', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      delete (global.window as any).PublicKeyCredential

      const result = await service.setupPasskey()

      expect(result).toBe(SetupResult.Failed)
    })

    it('should return Success when passkey setup succeeds', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      mockCredentials.create.mockResolvedValue({ id: 'new-credential-id' })

      const result = await service.setupPasskey()

      expect(result).toBe(SetupResult.Success)
      expect(mockCredentials.create).toHaveBeenCalledWith({
        publicKey: {
          challenge: expect.any(Uint8Array),
          rp: {
            name: 'ADAMANT Messenger',
            id: 'localhost'
          },
          user: {
            id: expect.any(Uint8Array),
            name: 'ADM U12345678901234567890',
            displayName: 'ADM U12345678901234567890'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            userVerification: 'preferred',
            residentKey: 'required'
          },
          timeout: 30000
        }
      })
    })

    it('should return Cancel when user cancels setup', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      const cancelError = new Error('User cancelled setup')
      cancelError.name = 'NotAllowedError'
      mockCredentials.create.mockRejectedValue(cancelError)

      const result = await service.setupPasskey()

      expect(result).toBe(SetupResult.Cancel)
    })

    it('should return Failed when setup fails', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)
      const setupError = new Error('Setup failed')
      setupError.name = 'InvalidStateError'
      mockCredentials.create.mockRejectedValue(setupError)

      const result = await service.setupPasskey()

      expect(result).toBe(SetupResult.Failed)
    })
  })
})