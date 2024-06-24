import { bytesToHex } from '@/lib/hex'
import { createTransaction, estimateFee } from '@/lib/klayr/klayr-utils'
import { KlayrHashSettings } from './klayr-constants'
import { address as klayrAddress } from '@klayr/cryptography'
import pbkdf2 from 'pbkdf2'
import sodium from 'sodium-browserify-tweetnacl'

export class KlayrAccount {
  private readonly publicKey: Buffer
  private readonly secretKey: Buffer
  private readonly address: Buffer

  constructor(passphrase: string) {
    const klayrSeed = pbkdf2.pbkdf2Sync(
      passphrase,
      KlayrHashSettings.SALT,
      KlayrHashSettings.ITERATIONS,
      KlayrHashSettings.KEYLEN,
      KlayrHashSettings.DIGEST
    )
    const keyPair = sodium.crypto_sign_seed_keypair(klayrSeed)

    this.publicKey = keyPair.publicKey
    this.secretKey = keyPair.secretKey
    this.address = klayrAddress.getAddressFromPublicKey(keyPair.publicKey)
  }

  getKlayr32Address() {
    return klayrAddress.getKlayr32AddressFromPublicKey(this.publicKey)
  }

  getAddressBuffer() {
    return this.address
  }

  getAddressHex() {
    return bytesToHex(this.address)
  }

  async createTransaction(
    recipientAddress: string,
    amount: number | string,
    fee: number | string,
    nonce: number | string,
    data = ''
  ) {
    const encodedTransaction = createTransaction(
      { publicKey: this.publicKey, secretKey: this.secretKey },
      recipientAddress,
      amount,
      fee,
      nonce,
      data
    )

    return encodedTransaction
  }

  /**
   * Estimate transaction fee by KLY amount.
   *
   * @param amount KLY amount
   * @param data Transaction data field
   */
  estimateFee(amount?: string, data?: string) {
    return estimateFee({
      amount,
      keyPair: {
        publicKey: this.publicKey.toString('hex'),
        secretKey: this.secretKey.toString('hex')
      },
      recipientAddress: this.address.toString('hex'),
      data
    })
  }
}
