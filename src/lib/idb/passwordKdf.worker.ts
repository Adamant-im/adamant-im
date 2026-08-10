/// <reference lib="webworker" />

import { derivePasswordHashSync } from './passwordKdfCore'
import { isPasswordKdfDescriptor } from './passwordKdf'

import type { PasswordKdfRequest, PasswordKdfResponse } from './passwordKdf'

const workerScope = self as DedicatedWorkerGlobalScope

workerScope.onmessage = ({ data }: MessageEvent<PasswordKdfRequest>) => {
  try {
    if (typeof data?.password !== 'string' || !isPasswordKdfDescriptor(data.descriptor)) {
      throw new Error('Invalid password KDF request')
    }

    const hash = derivePasswordHashSync(data.password, data.descriptor)
    const response: PasswordKdfResponse = { ok: true, hash }

    workerScope.postMessage(response)
  } catch (error) {
    const response: PasswordKdfResponse = {
      ok: false,
      error: error instanceof Error ? error.message : 'Password derivation failed'
    }

    workerScope.postMessage(response)
  }
}
