import { describe, expect, it } from 'vitest'
import adamant from './adamant'

type AdamantKeypair = {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

describe('adamant utf8 decode flows', () => {
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

  it('decodes encrypted private values with utf8 payload', () => {
    const owner = adamant.makeKeypair(Buffer.alloc(32, 33)) as AdamantKeypair
    const sourceValue = 'données-secrètes 🔐'

    const encoded = adamant.encodeValue(sourceValue, owner.privateKey)
    const decoded = adamant.decodeValue(encoded.message, owner.privateKey, encoded.nonce)

    expect(decoded).toBe(sourceValue)
  })
})
