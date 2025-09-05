import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'
import { AuthenticationResult, AuthenticationService, SetupResult } from './types'

export class BiometricAuthService implements AuthenticationService {
  async authorizeUser(): Promise<AuthenticationResult> {
    if (!Capacitor.isNativePlatform()) {
      return AuthenticationResult.Failed
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Login to ADAMANT Messenger',
        title: 'Biometric Authentication'
      })
      return AuthenticationResult.Success
    } catch (error: unknown) {
      console.error(error)

      const errorMessage = (error as { code: number; message: string }).message

      if (errorMessage.toLowerCase().includes('cancel')) {
        return AuthenticationResult.Cancel
      }

      return AuthenticationResult.Failed
    }
  }

  async setupBiometric(): Promise<SetupResult> {
    if (!Capacitor.isNativePlatform()) {
      return SetupResult.Failed
    }

    try {
      const result = await NativeBiometric.isAvailable()
      return result.isAvailable ? SetupResult.Success : SetupResult.Failed
    } catch (error: unknown) {
      console.error(error)

      if (error instanceof Error && error.message.includes('cancel')) {
        return SetupResult.Cancel
      }

      return SetupResult.Failed
    }
  }
}
