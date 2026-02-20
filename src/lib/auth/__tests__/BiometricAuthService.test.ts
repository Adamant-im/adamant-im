import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'
import { BiometricAuthService } from '../BiometricAuthService'
import { AuthenticationResult, SetupResult } from '../types'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn()
  }
}))

vi.mock('@capgo/capacitor-native-biometric', () => ({
  NativeBiometric: {
    verifyIdentity: vi.fn(),
    isAvailable: vi.fn()
  }
}))

describe('BiometricAuthService', () => {
  let service: BiometricAuthService
  const mockCapacitor = vi.mocked(Capacitor)
  const mockNativeBiometric = vi.mocked(NativeBiometric)

  beforeEach(() => {
    service = new BiometricAuthService()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('authorizeUser', () => {
    it('should return Failed when not on native platform', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Failed)
    })

    it('should return Success when biometric verification succeeds', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true)
      mockNativeBiometric.verifyIdentity.mockResolvedValue(undefined)

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Success)
      expect(mockNativeBiometric.verifyIdentity).toHaveBeenCalledWith({
        reason: 'Login to ADAMANT Messenger',
        title: 'Biometric Authentication'
      })
    })

    it('should return Cancel when user cancels authentication', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true)
      const cancelError = { code: 10, message: 'User canceled authentication' }
      mockNativeBiometric.verifyIdentity.mockRejectedValue(cancelError)

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Cancel)
    })

    it('should return Failed when biometric verification fails', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true)
      const authError = { code: 11, message: 'Authentication failed' }
      mockNativeBiometric.verifyIdentity.mockRejectedValue(authError)

      const result = await service.authorizeUser()

      expect(result).toBe(AuthenticationResult.Failed)
    })
  })

  describe('setupBiometric', () => {
    it('should return Failed when not on native platform', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false)

      const result = await service.setupBiometric()

      expect(result).toBe(SetupResult.Failed)
    })

    it('should return Success when biometric is available', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true)
      mockNativeBiometric.isAvailable.mockResolvedValue({
        isAvailable: true,
        biometryType: 'touchId' as any
      })

      const result = await service.setupBiometric()

      expect(result).toBe(SetupResult.Success)
    })

    it('should return Failed when biometric is not available', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true)
      mockNativeBiometric.isAvailable.mockResolvedValue({
        isAvailable: false,
        biometryType: 'none' as any
      })

      const result = await service.setupBiometric()

      expect(result).toBe(SetupResult.Failed)
    })

    it('should return Cancel when setup is cancelled', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true)
      const cancelError = new Error('User cancelled setup')
      mockNativeBiometric.isAvailable.mockRejectedValue(cancelError)

      const result = await service.setupBiometric()

      expect(result).toBe(SetupResult.Cancel)
    })
  })
})