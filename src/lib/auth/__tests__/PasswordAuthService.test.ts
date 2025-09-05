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
    dispatch: vi.fn() // Mock dispatch function for sending actions
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

  describe('User authentication with password', () => {
    it('should successfully authenticate when user enters password', async () => {
      // Mock successful authentication
      mockStore.dispatch.mockResolvedValue(undefined)

      // User enters password and clicks "Unlock"
      const result = await passwordAuth.authorizeUser('user-password')

      // Authentication should succeed
      expect(result).toBe(AuthenticationResult.Success)
    })
  })
})
