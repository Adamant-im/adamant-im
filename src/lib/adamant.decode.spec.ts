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

  it('normalizes hexadecimal private keys when encoding chat messages', () => {
    const sender = adamant.makeKeypair(Buffer.alloc(32, 88)) as AdamantKeypair
    const recipient = adamant.makeKeypair(Buffer.alloc(32, 99)) as AdamantKeypair
    const sourceMessage = 'Hexadecimal sender key'

    const encoded = adamant.encodeMessage(
      sourceMessage,
      Buffer.from(recipient.publicKey).toString('hex'),
      Buffer.from(sender.privateKey).toString('hex')
    )

    expect(
      adamant.decodeMessage(encoded.message, sender.publicKey, recipient.privateKey, encoded.nonce)
    ).toBe(sourceMessage)
  })

  it('accepts byte public keys and hexadecimal private keys when encoding binary data', () => {
    const sender = adamant.makeKeypair(Buffer.alloc(32, 101)) as AdamantKeypair
    const recipient = adamant.makeKeypair(Buffer.alloc(32, 102)) as AdamantKeypair
    const source = Uint8Array.from([0, 1, 2, 127, 128, 254, 255])

    const encoded = adamant.encodeBinary(
      source,
      recipient.publicKey,
      Buffer.from(sender.privateKey).toString('hex')
    )
    const decoded = adamant.decodeBinary(
      encoded.binary,
      sender.publicKey,
      recipient.privateKey,
      encoded.nonce
    )

    expect(decoded).toEqual(source)
  })

  it('rejects malformed hexadecimal keys instead of silently coercing them', () => {
    const recipient = adamant.makeKeypair(Buffer.alloc(32, 103)) as AdamantKeypair

    expect(() => adamant.encodeMessage('message', recipient.publicKey, 'not-a-hex-key')).toThrow(
      /Private key must be an even-length hexadecimal string or Uint8Array/
    )
  })

  it('rejects malformed hexadecimal input on decode and address boundaries', () => {
    const sender = adamant.makeKeypair(Buffer.alloc(32, 105)) as AdamantKeypair
    const recipient = adamant.makeKeypair(Buffer.alloc(32, 106)) as AdamantKeypair
    const encodedMessage = adamant.encodeMessage('message', recipient.publicKey, sender.privateKey)
    const encodedValue = adamant.encodeValue('value', recipient.privateKey)
    const encodedBinary = adamant.encodeBinary(
      Uint8Array.from([1, 2, 3]),
      recipient.publicKey,
      sender.privateKey
    )

    expect(() =>
      adamant.decodeMessage('not-hex', sender.publicKey, recipient.privateKey, encodedMessage.nonce)
    ).toThrow(/Encrypted message must be an even-length hexadecimal string or Uint8Array/)
    expect(() => adamant.decodeValue('not-hex', recipient.privateKey, encodedValue.nonce)).toThrow(
      /Encrypted value must be an even-length hexadecimal string or Uint8Array/
    )
    expect(() =>
      adamant.decodeBinary(
        encodedBinary.binary,
        'not-hex',
        recipient.privateKey,
        encodedBinary.nonce
      )
    ).toThrow(/Sender public key must be an even-length hexadecimal string or Uint8Array/)
    expect(() => adamant.getAddressFromPublicKey('not-hex')).toThrow(
      /Public key must be an even-length hexadecimal string or Uint8Array/
    )
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

  it('keeps the AIP-3 brace framing interoperable when the payload contains braces', () => {
    const owner = adamant.makeKeypair(Buffer.alloc(32, 104)) as AdamantKeypair
    const sourceValue = 'prefix { nested: "value" } suffix'

    const encoded = adamant.encodeValue(sourceValue, owner.privateKey)

    expect(adamant.decodeValue(encoded.message, owner.privateKey, encoded.nonce)).toBe(sourceValue)
  })
})
