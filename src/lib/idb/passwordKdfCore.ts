import { scrypt } from '@noble/hashes/scrypt.js'

import { bytesToHex, hexToBytes } from '@/lib/hex'

import type { PasswordKdfDescriptor } from './passwordKdf'

// Noble accounts for 128 * r * (N + p), which is 32 MiB + 1 KiB for the descriptor below.
// 64 MiB is a fail-safe ceiling with headroom, not the amount scrypt allocates for this work factor.
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024

export function derivePasswordHashSync(
  password: string,
  descriptor: PasswordKdfDescriptor
): string {
  const hash = scrypt(password, hexToBytes(descriptor.salt), {
    N: descriptor.N,
    r: descriptor.r,
    p: descriptor.p,
    dkLen: descriptor.dkLen,
    maxmem: SCRYPT_MAX_MEMORY
  })

  return bytesToHex(hash)
}
