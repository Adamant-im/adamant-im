/**
 * Biometric authentication types for Web platform
 */

/**
 * Result of authentication attempt
 */
export enum AuthenticationResult {
  Success = 'success',
  Failed = 'failed',
  Cancel = 'cancel'
}

/**
 * Result of biometric setup attempt
 */
export enum SetupResult {
  Success = 'success',
  Failed = 'failed',
  Cancel = 'cancel'
}

/**
 * Authentication methods supported by the application
 */
export enum AuthenticationMethod {
  Passphrase = 'passphrase',
  Password = 'password',
  Biometric = 'biometric',
  Passkey = 'passkey'
}

/**
 * Common interface for all authentication services
 */
export interface AuthenticationService {
  authorizeUser(password?: string): Promise<AuthenticationResult>
}
