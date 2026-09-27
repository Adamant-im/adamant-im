import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(path.resolve(currentDir, relativePath), 'utf8')

const MIRROR_MIXIN = 'directionalIcon.a-directional-icon()'

describe('RTL UI contract', () => {
  it('mirrors icons that point along the reading direction', () => {
    const componentsWithDirectionalIcons = [
      '../../components/common/BackButton/BackButton.vue',
      '../../components/AChat/AChatForm.vue',
      '../../components/WalletCard.vue',
      '../../components/Pagination.vue',
      '../../components/transactions/TransactionTemplate.vue',
      '../Login.vue',
      '../Options.vue',
      '../devScreens/DevScreens.vue'
    ]

    for (const componentPath of componentsWithDirectionalIcons) {
      expect(read(componentPath), componentPath).toContain(MIRROR_MIXIN)
    }

    const mixin = read('../../assets/styles/components/_directional-icon.scss')

    // `dir` on the document root also reaches overlays teleported outside `.v-application`
    expect(mixin).toContain("[dir='rtl'] &")
    expect(mixin).toContain('transform: scaleX(-1)')
  })

  it('keeps RTL rules in components instead of global selectors', () => {
    const layout = read('../../assets/styles/generic/_layout.scss')

    expect(layout).not.toMatch(/dir=|is-rtl|unicode-bidi/)
  })

  it('renders passphrases left to right in every locale', () => {
    expect(read('../../components/LoginForm.vue')).toMatch(
      /autocomplete="current-password"\s+dir="ltr"/
    )
    expect(read('../../components/PassphraseGenerator.vue')).toMatch(
      /:value="displayedPassphrase"[\s\S]{0,60}dir="ltr"/
    )
  })

  it('lets typed and received message text follow its own direction', () => {
    expect(read('../../components/AChat/AChatForm.vue')).toMatch(/v-model="message"\s+dir="auto"/)
    expect(read('../../components/AChat/AChatTransaction.vue')).toContain(
      'class="a-chat__message-text a-chat__transaction-note" dir="auto"'
    )
    expect(read('../../components/AChat/AChatAttachment/AChatAttachment.vue')).toContain(
      'class="a-chat__message-text" dir="auto"'
    )
    expect(read('../../assets/styles/components/_chat-message-content.scss')).toContain(
      'text-align: start;'
    )
  })

  it('isolates transfer destinations, amounts and transaction identifiers', () => {
    const sendFunds = read('../../components/SendFundsForm.vue')
    const transaction = read('../../components/transactions/TransactionTemplate.vue')

    expect(sendFunds).toMatch(/v-model\.trim="cryptoAddress"\s+dir="ltr"/)
    expect(sendFunds).toMatch(/v-model="amountString"\s+dir="ltr"/)
    expect(sendFunds).toContain('unicode-bidi: isolate;')
    expect(transaction).toContain('<bdi dir="ltr">{{ transaction?.id || placeholder }}</bdi>')
    expect(read('../../components/WalletCard.vue')).toContain('<bdi dir="ltr">{{ address }}</bdi>')
    expect(read('../../components/PartnerInfo.vue')).toContain('<bdi dir="ltr">{{ address }}</bdi>')
    expect(read('../../components/AChat/AChatTransaction.vue')).toContain(
      '<bdi dir="ltr">{{ currencyFormatter(transaction.amount, crypto) }}</bdi>'
    )
    expect(read('../../components/ChatPreview.vue')).toContain(
      '<bdi dir="ltr">{{ transactionPreviewAmount }}</bdi>'
    )
  })

  it('separates isolated values with a logical gap, not a space inside the isolate', () => {
    const transaction = read('../../components/transactions/TransactionTemplate.vue')

    // A leading space inside `<bdi>` lands on the outer side of the value in RTL locales
    expect(transaction).not.toMatch(/<bdi[^>]*>\{\{\s*`\s/)
    expect(transaction).toMatch(/&__value-muted \{[^}]*margin-inline-start/)
    expect(read('../../components/WalletCard.vue')).toMatch(/&__rate \{[^}]*margin-inline-start/)
  })

  it('positions the passphrase visibility toggle with logical properties', () => {
    const loginForm = read('../../components/LoginForm.vue')

    expect(loginForm).toContain('margin-inline-start: var(--a-login-form-passphrase-toggle-offset)')
    expect(loginForm).not.toMatch(/margin-left|padding-left|padding-right|dir='rtl'/)
  })

  it('lays out chat bubbles with logical properties so RTL locales mirror them', () => {
    const chat = read('../../assets/styles/components/_chat.scss')

    expect(chat).toContain('float: inline-start;')
    expect(chat).toContain('float: inline-end;')
    expect(chat).not.toMatch(/float: (left|right)/)
    expect(chat).toContain('inset-inline-start: -6px;')
    expect(chat).toContain('inset-inline-end: -6px;')
    expect(chat).toContain('rotate(var(--a-chat-message-tail-tilt))')
    expect(chat).not.toMatch(/(margin|padding|border)-(left|right)|text-align: (left|right)/)

    const styleOf = (source) => source.slice(source.indexOf('<style'))
    const sidedComponents = [
      '../../components/AChat/AChatMessage.vue',
      '../../components/AChat/AChatReactions/AChatReactions.vue',
      '../../components/AChat/AChatReactions/AChatReaction.vue',
      '../../components/AChat/AChatActionsOverlay.vue',
      '../../components/AChat/AChatReplyPreview.vue',
      '../../components/AChat/QuotedMessage.vue',
      '../../components/AChat/AChatAttachment/AChatFile.vue'
    ]

    for (const componentPath of sidedComponents) {
      // Full-width `left: 0; right: 0` insets are symmetric and stay physical
      expect(styleOf(read(componentPath)), componentPath).not.toMatch(
        /(margin|padding|border)-(left|right)|(?<![\w-])(left|right): (?!0;|unset;)/
      )
    }
  })
})
