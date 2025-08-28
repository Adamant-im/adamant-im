import { AuthenticationResult, AuthenticationService } from './types'
import store from '@/store'

/**
 * Password-based authentication service
 * Uses user-provided password to encrypt/decrypt stored passphrase
 */
export class PasswordAuthService implements AuthenticationService {
  get isAvailable(): boolean {
    // Password is always available as a fallback authentication method
    return true
  }

  async authorizeUser(password: string): Promise<AuthenticationResult> {
    await store.dispatch('loginViaAuthentication', { password })
    return AuthenticationResult.Success
  }
}
