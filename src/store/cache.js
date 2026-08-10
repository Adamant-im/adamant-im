import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes } from '@noble/hashes/utils.js'
import { mnemonicToSeedSync } from '@scure/bip39'

import { bytesToHex } from '@/lib/hex'

let cachedSeed = new Map()

export default {
  /**
   * Creates seed from mnemonic
   * bip39.mnemonicToSeedSync is time consuming, so we use cached value, if possible
   * Though, it is used for ADM and ETH accounts only
   * @param {string} passphrase
   * @return {string} seed
   */
  mnemonicToSeedSync(passphrase) {
    const passphraseHash = bytesToHex(sha256(utf8ToBytes(passphrase)))

    if (!cachedSeed.has(passphraseHash)) {
      cachedSeed.set(passphraseHash, mnemonicToSeedSync(passphrase))
    }

    return cachedSeed.get(passphraseHash)
  },
  resetCachedSeed() {
    cachedSeed = new Map()
  }
}
