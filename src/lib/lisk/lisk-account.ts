import { bytesToHex } from '@/lib/hex'
import { createTransaction, estimateFee } from '@/lib/lisk/lisk-utils.ts'
import { LiskHashSettings } from './lisk-constants'
import { address as liskAddress } from '@liskhq/lisk-cryptography'
import pbkdf2 from 'pbkdf2'
import sodium from 'sodium-browserify-tweetnacl'

export class LiskAccount {
  private readonly publicKey: Buffer
  private readonly secretKey: Buffer
  private readonly address: Buffer

  constructor(passphrase: string) {
    const liskSeed = pbkdf2.pbkdf2Sync(
      passphrase,
      LiskHashSettings.SALT,
      LiskHashSettings.ITERATIONS,
      LiskHashSettings.KEYLEN,
      LiskHashSettings.DIGEST
    )
    const keyPair: { publicKey: Buffer; secretKey: Buffer } =
      sodium.crypto_sign_seed_keypair(liskSeed)

    this.publicKey = keyPair.publicKey
    this.secretKey = keyPair.secretKey
    this.address = liskAddress.getAddressFromPublicKey(keyPair.publicKey)
  }

  getLisk32Address() {
    return liskAddress.getLisk32AddressFromPublicKey(this.publicKey)
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
   * Estimate transaction fee by LSK amount.
   *
   * @param amount LSK amount
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
