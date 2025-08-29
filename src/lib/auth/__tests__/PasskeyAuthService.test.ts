import { vi, describe, it, expect, beforeEach } from 'vitest'
// Import testing functions from vitest library
import { PasskeyAuthService } from '../PasskeyAuthService'
// Import the class we want to test
import { AuthenticationResult, SetupResult } from '../types'
// Import authentication and setup result types
import { Capacitor } from '@capacitor/core'

// Replace real Capacitor with our mock to control its behavior
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn()
  }
}))

// Get mocked Capacitor for type safety
const mockCapacitor = vi.mocked(Capacitor)

// Mock WebAuthn API for testing passkey functionality
const mockCredentials = {
  get: vi.fn(),    // For authentication with existing passkey
  create: vi.fn()  // For creating new passkey
}

describe('PasskeyAuthService', () => {
  let passkeyAuth: PasskeyAuthService
  // Declare variable for the service instance we're testing

  beforeEach(() => {
    // This function runs before each test for clean state
    passkeyAuth = new PasskeyAuthService()
    // Create new service instance
    vi.clearAllMocks()
    // Reset all mocks to initial state
    
    // Set up global browser objects for each test
    Object.defineProperty(global, 'navigator', {
      value: { credentials: mockCredentials },
      writable: true
    })
    // Mock navigator.credentials (WebAuthn API)
    
    Object.defineProperty(global, 'window', {
      value: { 
        PublicKeyCredential: function() {},  // Mock constructor for WebAuthn support
        location: { hostname: 'messenger.adamant.im' },  // Mock site domain
        crypto: {
          getRandomValues: vi.fn(() => new Uint8Array(32))  // Mock random number generator
        }
      },
      writable: true
    })
  })

  describe('User tries to authenticate with passkey in web browser', () => {
    beforeEach(() => {
      // For these tests simulate web browser (not mobile app)
      mockCapacitor.isNativePlatform.mockReturnValue(false)
    })

    it('should successfully authenticate when user confirms passkey', async () => {
      // Simulate successful passkey confirmation by user
      mockCredentials.get.mockResolvedValue({ id: 'credential-id', type: 'public-key' })

      // User clicks login button and confirms through passkey
      const result = await passkeyAuth.authorizeUser()

      // Check that credentials.get was called with correct WebAuthn parameters
      expect(mockCredentials.get).toHaveBeenCalledWith({
        publicKey: {
          challenge: expect.any(Uint8Array),
          rpId: 'messenger.adamant.im',
          userVerification: 'preferred',
          timeout: 30000
        }
      })
      // Check that authentication was successful
      expect(result).toBe(AuthenticationResult.Success)
    })

    it('should return cancel when user cancels passkey prompt with NotAllowedError', async () => {
      // Simulate user cancellation (clicked "Cancel" in system dialog)
      const cancelError = new Error('User cancelled')
      cancelError.name = 'NotAllowedError'
      mockCredentials.get.mockRejectedValue(cancelError)

      // User starts authentication but cancels it in system dialog
      const result = await passkeyAuth.authorizeUser()

      // Expect "cancel" result, not error
      expect(result).toBe(AuthenticationResult.Cancel)
    })

    it('should return cancel when user cancels passkey prompt with AbortError', async () => {
      // Simulate user cancellation with different error type
      const cancelError = new Error('User aborted')
      cancelError.name = 'AbortError'
      mockCredentials.get.mockRejectedValue(cancelError)

      // User starts authentication but cancels it
      const result = await passkeyAuth.authorizeUser()

      // Should also return Cancel for AbortError
      expect(result).toBe(AuthenticationResult.Cancel)
    })

    it('should return failed when error is not cancellation', async () => {
      // Simulate error that is NOT NotAllowedError or AbortError
      const authError = new Error('Authentication failed')
      authError.name = 'InvalidStateError'
      mockCredentials.get.mockRejectedValue(authError)

      // User tries to login but gets non-cancellation error
      const result = await passkeyAuth.authorizeUser()

      // Should return Failed (not Cancel) because error is not cancellation type
      expect(result).toBe(AuthenticationResult.Failed)
    })

    it('should return failed when browser does not support WebAuthn', async () => {
      // Mock old browser without WebAuthn API support
      Object.defineProperty(global, 'navigator', {
        value: {},  // Remove credentials from navigator
        writable: true
      })

      // User tries to use passkey in incompatible browser
      const result = await passkeyAuth.authorizeUser()

      // Expect failure due to lack of support
      expect(result).toBe(AuthenticationResult.Failed)
    })
  })

  describe('User tries to authenticate with passkey in mobile app', () => {
    beforeEach(() => {
      // Simulate mobile application
      mockCapacitor.isNativePlatform.mockReturnValue(true)
    })

    it('should return failed as passkeys not supported in mobile app', async () => {
      // Passkeys are not yet implemented in mobile app
      const result = await passkeyAuth.authorizeUser()

      // Expect failure as feature is only available in web version
      expect(result).toBe(AuthenticationResult.Failed)
    })
  })

  describe('User wants to setup passkey authentication', () => {
    beforeEach(() => {
      // Setup is only possible in browser
      mockCapacitor.isNativePlatform.mockReturnValue(false)
    })

    it('should successfully create passkey when user confirms', async () => {
      // Simulate successful passkey creation (user confirmed via biometrics/PIN)
      mockCredentials.create.mockResolvedValue({
        id: 'new-credential-id',
        type: 'public-key'
      })

      // User clicked "Setup passkey" and completed creation process
      const result = await passkeyAuth.setupPasskey()

      // Setup should succeed
      expect(result).toBe(SetupResult.Success)
    })

    it('should return cancel when user cancels passkey creation', async () => {
      // Simulate user cancelling passkey creation
      const cancelError = new Error('User cancelled setup')
      cancelError.name = 'AbortError'
      mockCredentials.create.mockRejectedValue(cancelError)

      // User starts setup but cancels it
      const result = await passkeyAuth.setupPasskey()

      // Expect "cancel" result
      expect(result).toBe(SetupResult.Cancel)
    })

    it('should return failed when passkey creation fails', async () => {
      // Simulate creation error (e.g., device issues)
      const creationError = new Error('Creation failed')
      mockCredentials.create.mockRejectedValue(creationError)

      // User tries to setup passkey but process fails with error
      const result = await passkeyAuth.setupPasskey()

      // Expect failed setup
      expect(result).toBe(SetupResult.Failed)
    })

    it('should return failed when trying to setup in mobile app', async () => {
      // Simulate setup attempt in mobile app
      mockCapacitor.isNativePlatform.mockReturnValue(true)

      // User tries to setup passkey in mobile app
      const result = await passkeyAuth.setupPasskey()

      // Expect failure as feature is not supported in mobile apps
      expect(result).toBe(SetupResult.Failed)
    })
  })
})