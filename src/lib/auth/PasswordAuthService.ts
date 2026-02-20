import { AuthenticationResult, AuthenticationService } from './types'
import store from '@/store'

/**
 * Password-based authentication service
 * Uses user-provided password to encrypt/decrypt stored passphrase
 */
export class PasswordAuthService implements AuthenticationService {
  async authorizeUser(password: string): Promise<AuthenticationResult> {
    await store.dispatch('loginViaPassword', password)
    return AuthenticationResult.Success
  }
}
