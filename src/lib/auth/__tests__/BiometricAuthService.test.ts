import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BiometricAuthService } from '../BiometricAuthService'
import { AuthenticationResult, SetupResult } from '../types'
import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'

// Replace imports with mocks to control their behavior in tests
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

// Get mocked instances for type safety
const mockCapacitor = vi.mocked(Capacitor)
const mockNativeBiometric = vi.mocked(NativeBiometric)

describe('BiometricAuthService', () => {
  let biometricAuth: BiometricAuthService

  beforeEach(() => {
    // Create new service instance before each test for isolation
    biometricAuth = new BiometricAuthService()
    // Clear all mocks so tests don't affect each other
    vi.clearAllMocks()
  })

  describe('User tries to authenticate with biometrics on mobile device', () => {
    beforeEach(() => {
      // Simulate that we're on mobile platform (Android/iOS)
      mockCapacitor.isNativePlatform.mockReturnValue(true)
    })

    it('should successfully authenticate when user provides valid biometric', async () => {
      // Simulate successful biometric verification (fingerprint/Face ID)
      mockNativeBiometric.verifyIdentity.mockResolvedValue(undefined)

      // User clicks "Login with biometric" button
      const result = await biometricAuth.authorizeUser()

      // Check that verifyIdentity was called with correct parameters
      expect(mockNativeBiometric.verifyIdentity).toHaveBeenCalledWith({
        reason: 'Login to ADAMANT Messenger',
        title: 'Biometric Authentication'
      })
      // Expect successful authentication
      expect(result).toBe(AuthenticationResult.Success)
    })

    it('should return cancel when user cancels biometric prompt', async () => {
      // Simulate user clicking "Cancel" in biometric dialog (must include 'cancel' in message)
      const cancelError = new Error('User cancelled biometric authentication')
      mockNativeBiometric.verifyIdentity.mockRejectedValue(cancelError)

      // User starts authentication but cancels it
      const result = await biometricAuth.authorizeUser()

      // Expect "cancel" result, not error
      expect(result).toBe(AuthenticationResult.Cancel)
    })

    it('should return failed when biometric authentication fails', async () => {
      // Simulate unsuccessful biometric recognition (error WITHOUT 'cancel' keyword)
      const authError = new Error('Biometric authentication failed')
      mockNativeBiometric.verifyIdentity.mockRejectedValue(authError)

      // User tries to login but biometric is not recognized
      const result = await biometricAuth.authorizeUser()

      // Expect failed authentication
      expect(result).toBe(AuthenticationResult.Failed)
    })

    it('should return failed when error does not contain cancel keyword', async () => {
      // Simulate error that does not contain 'cancel' (should be Failed, not Cancel)
      const nonCancelError = new Error('Biometric sensor unavailable')
      mockNativeBiometric.verifyIdentity.mockRejectedValue(nonCancelError)

      // User tries to authenticate but gets non-cancel error
      const result = await biometricAuth.authorizeUser()

      // Should return Failed (not Cancel) because error doesn't contain 'cancel'
      expect(result).toBe(AuthenticationResult.Failed)
    })
  })

  describe('User tries to authenticate with biometrics in web browser', () => {
    beforeEach(() => {
      // Simulate that we're in web browser, not native app
      mockCapacitor.isNativePlatform.mockReturnValue(false)
    })

    it('should return failed as biometrics not available in browser', async () => {
      // Biometrics are not available in browser
      const result = await biometricAuth.authorizeUser()

      // Expect authentication to fail
      expect(result).toBe(AuthenticationResult.Failed)
    })
  })

  describe('User wants to setup biometric authentication', () => {
    beforeEach(() => {
      // Setup is only possible on mobile devices
      mockCapacitor.isNativePlatform.mockReturnValue(true)
    })

    it('should successfully setup when device supports biometrics', async () => {
      // Device supports biometrics (has fingerprint sensor/Face ID)
      mockNativeBiometric.isAvailable.mockResolvedValue({
        isAvailable: true,
        biometryType: 1
      })

      // User tries to enable biometric authentication
      const result = await biometricAuth.setupBiometric()

      // Setup should succeed
      expect(result).toBe(SetupResult.Success)
    })

    it('should fail setup when device does not support biometrics', async () => {
      // Device doesn't support biometrics (old device without sensors)
      mockNativeBiometric.isAvailable.mockResolvedValue({
        isAvailable: false,
        biometryType: 0
      })

      // User tries to enable biometrics on unsupported device
      const result = await biometricAuth.setupBiometric()

      // Setup should fail
      expect(result).toBe(SetupResult.Failed)
    })

    it('should return cancel when user cancels biometric setup', async () => {
      // Simulate user cancelling during setup (includes 'cancel' keyword)
      const cancelError = new Error('cancel')
      mockNativeBiometric.isAvailable.mockRejectedValue(cancelError)

      // User starts biometric setup but cancels it
      const result = await biometricAuth.setupBiometric()

      // Should return Cancel for setup cancellation
      expect(result).toBe(SetupResult.Cancel)
    })
  })
})
