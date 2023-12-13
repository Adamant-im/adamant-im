import * as bip39 from 'bip39'
import crypto from 'crypto'

let cachedSeed = []

export default {
  /**
   * Creates seed from mnemonic
   * bip39.mnemonicToSeedSync is time consuming, so we use cached value, if possible
   * Though, it is used for ADM and ETH accounts only
   * @param {string} passphrase
   * @return {string} seed
   */
  mnemonicToSeedSync(passphrase) {
    const passphraseHash = crypto.createHash('sha256').update(passphrase).digest('hex')
    cachedSeed[passphraseHash] = cachedSeed[passphraseHash] || bip39.mnemonicToSeedSync(passphrase)
    return cachedSeed[passphraseHash]
  },
  resetCachedSeed() {
    cachedSeed = []
  }
}
