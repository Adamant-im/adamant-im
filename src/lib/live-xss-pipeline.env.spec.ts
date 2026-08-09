import { describe, expect, it, beforeAll } from 'vitest'
import { config as loadEnv } from 'dotenv'

import nacl from 'tweetnacl'

import adamant from '@/lib/adamant'
import { renderMarkdown, renderPlainText } from '@/lib/markdown'
import { renderSafeHtml } from '@/components/common/SafeHtml'
import { XSS_PAYLOADS, findExecutableMarkup } from '@/lib/__fixtures__/xssPayloads'

loadEnv({ path: '.env.local', quiet: true })

const senderPassphrase = process.env.ADM_AGENT1_PK?.trim()
const recipientPassphrase = process.env.ADM_AGENT2_PK?.trim()
const liveDescribe = senderPassphrase && recipientPassphrase ? describe : describe.skip

/**
 * Only ADM chat messages are ever sent here, which costs a fraction of an ADM — no coin
 * transfers, so a routine run cannot spend real money.
 *
 * Sending is still avoided when it is not needed: the payloads written by an earlier run are
 * still in the chat, and verifying those exercises the same path for free. A message is
 * broadcast only when a new payload is added to `LIVE_PAYLOADS` and is not on chain yet.
 */

if (!(senderPassphrase && recipientPassphrase)) {
  console.warn(
    '\n[vitest] ADM_AGENT1_PK / ADM_AGENT2_PK are not set — the live XSS pipeline test is skipped.\n'
  )
}

const NODE = 'https://endless.adamant.im'

/**
 * Payloads written to the chain by this test. They are end-to-end encrypted between the two
 * test accounts, so nobody else can read them, but they are permanent — keep the list short
 * and only add a payload that exercises a distinct rendering path.
 */
const LIVE_PAYLOADS = [
  XSS_PAYLOADS.rawTag,
  XSS_PAYLOADS.entityEncodedTag,
  XSS_PAYLOADS.linkAttributeBreakout,
  XSS_PAYLOADS.phishingForm,
  XSS_PAYLOADS.overlayByStyle,
  XSS_PAYLOADS.mutationXss
]

type Keypair = { publicKey: Uint8Array; privateKey: Uint8Array }

function accountFor(passphrase: string) {
  // The global Buffer and the one the polyfilled crypto returns live in different realms
  // under vitest, and tweetnacl's `instanceof Uint8Array` check fails across them.
  const hash = Buffer.from(adamant.createPassphraseHash(passphrase) as unknown as Uint8Array)
  const keypair = adamant.makeKeypair(hash) as Keypair
  const publicKeyHex = Buffer.from(keypair.publicKey).toString('hex')
  const privateKeyHex = Buffer.from(keypair.privateKey).toString('hex')
  // `adamant.encodeMessage` does not normalize a hex string to bytes the way
  // `adamant.decodeMessage` does, so it must be handed the raw key.
  const privateKey = Buffer.from(keypair.privateKey)
  const address = adamant.getAddressFromPublicKey(publicKeyHex)

  return { keypair, address, publicKeyHex, privateKeyHex, privateKey }
}

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${NODE}${path}`, init)
  return response.json()
}

async function nodeTimeDelta() {
  const status = await api('/api/node/status')
  const nodeTimestamp = status?.network?.timestamp ?? adamant.epochTime()

  return adamant.epochTime() - nodeTimestamp
}

async function sendChatMessage(
  sender: ReturnType<typeof accountFor>,
  recipient: ReturnType<typeof accountFor>,
  text: string,
  timeDelta: number
) {
  const encoded = adamant.encodeMessage(text, recipient.publicKeyHex, sender.privateKey)

  const transaction: Record<string, unknown> = {
    type: 8,
    amount: 0,
    senderId: sender.address,
    senderPublicKey: sender.publicKeyHex,
    recipientId: recipient.address,
    asset: {
      chat: {
        message: encoded.message,
        own_message: encoded.nonce,
        type: 1
      }
    }
  }

  transaction.timestamp = Math.floor(Number(adamant.epochTime()) - timeDelta)

  // `adamant.getBytes` is the part that must match the network; the signing wrapper is
  // bypassed only because its Buffer instances cross realms under vitest.
  const hash = Buffer.from(adamant.getHash(transaction) as unknown as Uint8Array)
  const privateKey = Buffer.from(sender.privateKeyHex, 'hex')
  transaction.signature = Buffer.from(nacl.sign.detached(hash, privateKey)).toString('hex')

  return api('/api/chats/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction })
  })
}

function inspectVNodes(nodes: unknown): { tags: string[]; attributes: string[] } {
  const tags: string[] = []
  const attributes: string[] = []

  const walk = (node: any) => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    if (!node || typeof node !== 'object') return

    if (typeof node.type === 'string') tags.push(node.type)
    if (node.props) attributes.push(...Object.keys(node.props))
    if (node.children) walk(node.children)
  }

  walk(nodes)

  return { tags, attributes }
}

liveDescribe('live XSS pipeline against mainnet', () => {
  const sender = accountFor(senderPassphrase as string)
  const recipient = accountFor(recipientPassphrase as string)

  beforeAll(() => {
    console.log(`[live] sender    ${sender.address}`)
    console.log(`[live] recipient ${recipient.address}`)
  })

  it('derives both test addresses from their public keys', () => {
    expect(adamant.getAddressFromPublicKey(sender.publicKeyHex)).toBe(sender.address)
    expect(adamant.getAddressFromPublicKey(recipient.publicKeyHex)).toBe(recipient.address)
  })

  it('renders hostile messages fetched from the chain without producing executable markup', async () => {
    const readRoom = async () => {
      const room = await api(
        `/api/chatrooms/${recipient.address}/${sender.address}?limit=100&orderBy=timestamp:desc`
      )

      expect(room.success, JSON.stringify(room).slice(0, 300)).toBe(true)

      const texts: string[] = []

      for (const message of room.messages ?? []) {
        if (message.type !== 8 || !message.asset?.chat) continue

        // Every public key the node hands back must derive the address it is claimed for
        expect(
          adamant.getAddressFromPublicKey(message.senderPublicKey),
          `senderPublicKey does not derive senderId for ${message.id}`
        ).toBe(message.senderId)
        expect(
          adamant.getAddressFromPublicKey(message.recipientPublicKey),
          `recipientPublicKey does not derive recipientId for ${message.id}`
        ).toBe(message.recipientId)

        const text = adamant.decodeMessage(
          message.asset.chat.message,
          message.senderPublicKey,
          recipient.privateKeyHex,
          message.asset.chat.own_message
        )

        if (text) texts.push(text)
      }

      return texts
    }

    let decoded = await readRoom()
    const missing = LIVE_PAYLOADS.filter((payload) => !decoded.includes(payload))

    if (missing.length > 0) {
      console.log(`[live] broadcasting ${missing.length} payload(s) not yet on chain`)

      const timeDelta = await nodeTimeDelta()

      for (const payload of missing) {
        const result = await sendChatMessage(sender, recipient, payload, timeDelta)
        expect(result.success, `send failed: ${JSON.stringify(result)}`).toBe(true)
      }

      // Poll until the transactions are included in a block and visible in the chatroom
      // projection. ADAMANT block time is about 5 seconds.
      const deadline = Date.now() + 90_000

      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 6000))
        decoded = await readRoom()

        if (LIVE_PAYLOADS.every((payload) => decoded.includes(payload))) break
      }
    }

    console.log(`[live] decoded ${decoded.length} messages from the chain`)

    const found = LIVE_PAYLOADS.filter((payload) => decoded.includes(payload))
    expect(found.length, `payloads round-tripped: ${found.length}/${LIVE_PAYLOADS.length}`).toBe(
      LIVE_PAYLOADS.length
    )

    for (const text of decoded) {
      // Formatting enabled: markdown pipeline
      const markdownHtml = renderMarkdown(text)
      expect(findExecutableMarkup(markdownHtml), `markdown: ${text}`).toEqual([])

      // Formatting disabled: escaped plain text
      const plainHtml = renderPlainText(text)
      expect(plainHtml.includes('<'), `plain text: ${text}`).toBe(false)

      // And the sink itself, on both
      for (const html of [markdownHtml, plainHtml]) {
        const { tags, attributes } = inspectVNodes(renderSafeHtml(html))

        expect(tags, `tags for: ${text}`).not.toContain('form')
        expect(tags, `tags for: ${text}`).not.toContain('script')
        expect(tags, `tags for: ${text}`).not.toContain('img')
        expect(
          attributes.filter((name) => name.startsWith('on') || name === 'style'),
          `attributes for: ${text}`
        ).toEqual([])
      }
    }
  }, 180000)
})
