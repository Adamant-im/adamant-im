import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PasswordAuthService } from '../PasswordAuthService'
import { AuthenticationResult } from '../types'

vi.mock('@/store', () => ({
  default: {
    dispatch: vi.fn()
  }
}))

describe('PasswordAuthService', () => {
  let service: PasswordAuthService
  let mockStore: any

  beforeEach(async () => {
    const store = await import('@/store')
    mockStore = store.default
    service = new PasswordAuthService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('authorizeUser', () => {
    it('should return Success when login via password succeeds', async () => {
      mockStore.dispatch.mockResolvedValue({ passphrase: 'test-passphrase' })

      const result = await service.authorizeUser('correct-password')

      expect(result).toBe(AuthenticationResult.Success)
      expect(mockStore.dispatch).toHaveBeenCalledWith('loginViaPassword', 'correct-password')
    })

    it('should throw error when login via password fails', async () => {
      const loginError = new Error('Incorrect password')
      mockStore.dispatch.mockRejectedValue(loginError)

      await expect(service.authorizeUser('wrong-password')).rejects.toThrow('Incorrect password')
      expect(mockStore.dispatch).toHaveBeenCalledWith('loginViaPassword', 'wrong-password')
    })

    it('should throw error when empty password provided', async () => {
      const emptyPasswordError = new Error('Password cannot be empty')
      mockStore.dispatch.mockRejectedValue(emptyPasswordError)

      await expect(service.authorizeUser('')).rejects.toThrow('Password cannot be empty')
      expect(mockStore.dispatch).toHaveBeenCalledWith('loginViaPassword', '')
    })
  })
})