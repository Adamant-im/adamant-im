import { describe, expect, it } from 'vitest'
import adamant from './adamant'

type AdamantKeypair = {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

describe('adamant utf8 decode flows', () => {
  it('preserves the ADM key and address derivation vector', () => {
    const passphrase =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    const hash = adamant.createPassphraseHash(passphrase)
    const keypair = adamant.makeKeypair(hash) as AdamantKeypair

    expect(Buffer.from(hash).toString('hex')).toBe(
      '62a772f85e4be6226108b56c0b1cf935c2490e434adec864fe47b189f1ed517d'
    )
    expect(Buffer.from(keypair.publicKey).toString('hex')).toBe(
      '58032e75cd5ee0bbcacbed1e38c3da4bf0f162aba2d7513d2d2fba2184327bd3'
    )
    expect(adamant.getAddressFromPublicKey(keypair.publicKey)).toBe('U5450667915320866213')
  })

  it('decodes encrypted chat messages with utf8 payload', () => {
    const sender = adamant.makeKeypair(Buffer.alloc(32, 11)) as AdamantKeypair
    const recipient = adamant.makeKeypair(Buffer.alloc(32, 22)) as AdamantKeypair
    const sourceMessage = 'Bonjour, ADAMANT 👋'
    const senderPublicKeyHex = Buffer.from(sender.publicKey).toString('hex')
    const recipientPublicKeyHex = Buffer.from(recipient.publicKey).toString('hex')
    const recipientPrivateKeyHex = Buffer.from(recipient.privateKey).toString('hex')

    const encoded = adamant.encodeMessage(sourceMessage, recipientPublicKeyHex, sender.privateKey)
    const decoded = adamant.decodeMessage(
      encoded.message,
      senderPublicKeyHex,
      recipientPrivateKeyHex,
      encoded.nonce
    )

    expect(decoded).toBe(sourceMessage)
  })

  it('preserves byte input when encoding a chat message', () => {
    const sender = adamant.makeKeypair(Buffer.alloc(32, 44)) as AdamantKeypair
    const recipient = adamant.makeKeypair(Buffer.alloc(32, 55)) as AdamantKeypair
    const sourceMessage = 'Binary-compatible message'
    const sourceBytes = new TextEncoder().encode(sourceMessage)

    const encoded = adamant.encodeMessage(sourceBytes, recipient.publicKey, sender.privateKey)
    const decoded = adamant.decodeMessage(
      encoded.message,
      sender.publicKey,
      recipient.privateKey,
      encoded.nonce
    )

    expect(decoded).toBe(sourceMessage)
  })

  it('rejects string input at byte-only cryptographic boundaries', () => {
    const sender = adamant.makeKeypair(Buffer.alloc(32, 66)) as AdamantKeypair
    const recipient = adamant.makeKeypair(Buffer.alloc(32, 77)) as AdamantKeypair
    const decodeStringSource = () => {
      return adamant.decodeBinary(
        // @ts-expect-error The runtime guard must also protect JavaScript callers.
        '00',
        sender.publicKey,
        recipient.privateKey,
        new Uint8Array(24)
      )
    }

    expect(decodeStringSource).toThrow(/Expected a Uint8Array/)
  })

  it('decodes encrypted private values with utf8 payload', () => {
    const owner = adamant.makeKeypair(Buffer.alloc(32, 33)) as AdamantKeypair
    const sourceValue = 'données-secrètes 🔐'

    const encoded = adamant.encodeValue(sourceValue, owner.privateKey)
    const decoded = adamant.decodeValue(encoded.message, owner.privateKey, encoded.nonce)

    expect(decoded).toBe(sourceValue)
  })
})
