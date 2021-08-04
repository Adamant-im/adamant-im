import * as bip39 from 'bip39'

let cachedSeed

export default {
  /**
   * Creates seed from mnemonic
   * bip39.mnemonicToSeedSync is time consuming, so we use cached value, if possible
   * @param {string} passphrase
   * @return {string} seed
   */
  mnemonicToSeedSync (passphrase) {
    cachedSeed = cachedSeed || bip39.mnemonicToSeedSync(passphrase)
    return cachedSeed
  },
  resetCachedSeed () {
    cachedSeed = undefined
  }
}
