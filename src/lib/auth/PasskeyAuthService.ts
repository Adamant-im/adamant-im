import { Capacitor } from '@capacitor/core'
import { AuthenticationResult, AuthenticationService, SetupResult } from './types'
import store from '@/store'

export class PasskeyAuthService implements AuthenticationService {
  async authorizeUser(): Promise<AuthenticationResult> {
    if (Capacitor.isNativePlatform()) {
      return AuthenticationResult.Failed
    }

    if (!('credentials' in navigator && !!window.PublicKeyCredential)) {
      return AuthenticationResult.Failed
    }

    try {
      const rpId = window.location.hostname || 'localhost'
      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId,
          userVerification: 'preferred',
          timeout: 30000
        }
      })
      return AuthenticationResult.Success
    } catch (error: unknown) {
      console.error(error)

      if (
        error instanceof Error &&
        (error.name === 'NotAllowedError' || error.name === 'AbortError')
      ) {
        return AuthenticationResult.Cancel
      }

      return AuthenticationResult.Failed
    }
  }

  async setupPasskey(): Promise<SetupResult> {
    if (Capacitor.isNativePlatform()) {
      return SetupResult.Failed
    }

    if (!('credentials' in navigator && !!window.PublicKeyCredential)) {
      return SetupResult.Failed
    }

    try {
      const rpId = window.location.hostname || 'localhost'
      await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: 'ADAMANT Messenger',
            id: rpId
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(32)),
            name: `ADM ${store.state.address || 'User'}`,
            displayName: `ADM ${store.state.address || 'User'}`
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            userVerification: 'preferred',
            residentKey: 'required'
          },
          timeout: 30000
        }
      })
      return SetupResult.Success
    } catch (error: unknown) {
      console.error(error)

      if (
        error instanceof Error &&
        (error.name === 'NotAllowedError' || error.name === 'AbortError')
      ) {
        return SetupResult.Cancel
      }

      return SetupResult.Failed
    }
  }
}
