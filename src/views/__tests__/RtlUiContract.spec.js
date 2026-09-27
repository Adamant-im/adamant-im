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
})
