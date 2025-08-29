import { vi, describe, it, expect, beforeEach } from 'vitest'
// Import testing functions from vitest library
import { PasswordAuthService } from '../PasswordAuthService'
// Import the class we want to test
import { AuthenticationResult } from '../types'
// Import authentication result types
import store from '@/store'
// Import store to access mock

// Replace real store import with our mock
vi.mock('@/store', () => ({
  default: {
    dispatch: vi.fn()  // Mock dispatch function for sending actions
  }
}))

// Get mocked store for type safety
const mockStore = vi.mocked(store)

describe('PasswordAuthService', () => {
  let passwordAuth: PasswordAuthService
  // Declare variable for the service instance we're testing

  beforeEach(() => {
    // This function runs before each test for isolation
    passwordAuth = new PasswordAuthService()
    // Create new service instance
    vi.clearAllMocks()
    // Reset all mocks to initial state
  })

  describe('User can use password authentication', () => {
    it('should be available on all platforms', () => {
      // Check that password is available everywhere (web, mobile devices)
      expect(passwordAuth.isAvailable).toBe(true)
    })

    it('should successfully authenticate user with correct password', async () => {
      // Set up mock store.dispatch to resolve successfully
      mockStore.dispatch.mockResolvedValue(undefined)

      // User enters password and clicks login button
      const result = await passwordAuth.authorizeUser('user-password')

      // Check that store.dispatch was called with correct parameters
      expect(mockStore.dispatch).toHaveBeenCalledWith('loginViaAuthentication', { password: 'user-password' })
      // Check that authentication was successful
      expect(result).toBe(AuthenticationResult.Success)
    })

    it('should throw error when store dispatch fails with wrong password', async () => {
      // Set up mock store.dispatch to reject (wrong password)
      const authError = new Error('Invalid password')
      mockStore.dispatch.mockRejectedValue(authError)

      // User enters wrong password and clicks login button
      await expect(passwordAuth.authorizeUser('wrong-password')).rejects.toThrow('Invalid password')

      // Check that store.dispatch was called with wrong password
      expect(mockStore.dispatch).toHaveBeenCalledWith('loginViaAuthentication', { password: 'wrong-password' })
    })
  })
})