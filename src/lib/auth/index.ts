/**
 * Authentication Module
 *
 * Provides multiple authentication methods for web applications:
 * - Password: User-defined password authentication
 * - Biometric: Local biometric authentication (Touch ID/Face ID)
 * - Passkey: WebAuthn-based passkey authentication
 */

export { AuthenticationResult, AuthenticationMethod } from './types'

import { PasskeyAuthService } from './PasskeyAuthService'
import { BiometricAuthService } from './BiometricAuthService'
import { PasswordAuthService } from './PasswordAuthService'

export const passkeyAuth = new PasskeyAuthService()
export const biometricAuth = new BiometricAuthService()
export const passwordAuth = new PasswordAuthService()
