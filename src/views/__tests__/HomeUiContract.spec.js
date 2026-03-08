import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const homePath = path.resolve(currentDir, '../Home.vue')
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const walletCardPath = path.resolve(currentDir, '../../components/WalletCard.vue')
const walletActionsPath = path.resolve(currentDir, '../../components/WalletCardListActions.vue')

describe('Home UI style contract', () => {
  it('defines a shared token for default letter spacing', () => {
    const content = readFileSync(genericTokensPath, 'utf8')

    expect(content).toContain('--a-letter-spacing-normal')
  })

  it('defines shared wallet card spacing tokens', () => {
    const content = readFileSync(genericTokensPath, 'utf8')

    expect(content).toContain('--a-wallet-card-list-padding-top')
    expect(content).toContain('--a-wallet-card-item-padding-inline-start')
    expect(content).toContain('--a-wallet-card-item-padding-inline-end')
    expect(content).toContain('--a-wallet-card-subtitle-line-height')
    expect(content).toContain('calc(var(--a-space-6) + var(--a-space-1))')
    expect(content).toContain('var(--a-space-4)')
    expect(content).toContain('var(--a-line-height-md)')
  })

  it('uses tokenized wallet tabs spacing and sizing variables', () => {
    const content = readFileSync(homePath, 'utf8')

    expect(content).toContain('--a-account-tabs-slider-height')
    expect(content).toContain('--a-account-tabs-padding-top')
    expect(content).toContain('--a-account-tabs-padding-bottom')
    expect(content).toContain('--a-account-tabs-margin-bottom')
    expect(content).toContain('--a-account-tab-font-size')
    expect(content).toContain('--a-account-tab-font-weight')
    expect(content).toContain('--a-account-tab-font-weight-selected')
    expect(content).toContain('--a-account-tab-letter-spacing')
    expect(content).toContain('--a-account-tab-affix-width')
    expect(content).toContain('var(--a-font-size-md)')
    expect(content).toContain('var(--a-font-weight-light)')
    expect(content).toContain('var(--a-font-weight-medium)')
    expect(content).toContain('var(--a-letter-spacing-normal)')
    expect(content).toContain('var(--a-control-size-sm)')
    expect(content).toContain('var(--a-radius-round)')

    expect(content).not.toContain('font-size: 16px;')
    expect(content).not.toContain('flex-basis: 32px;')
    expect(content).not.toContain('min-width: 32px;')
    expect(content).not.toContain('font-weight: 300;')
    expect(content).not.toContain('font-weight: 500;')
    expect(content).not.toContain('letter-spacing: normal;')
  })

  it('uses shared wallet card spacing and typography tokens', () => {
    const content = readFileSync(walletCardPath, 'utf8')

    expect(content).toContain('walletCardActions: `${className}__actions`')
    expect(content).toContain('<WalletCardListActions :class="classes.walletCardActions"')
    expect(content).toContain('var(--a-wallet-card-subtitle-line-height)')
    expect(content).toContain('var(--a-wallet-card-list-padding-top)')
    expect(content).toContain('var(--a-wallet-card-item-padding-inline-start)')
    expect(content).toContain('var(--a-wallet-card-item-padding-inline-end)')
    expect(content).not.toContain('<WalletCardListActions :class="classes.walletCardList"')
    expect(content).not.toContain('line-height: 24px;')
    expect(content).not.toContain('padding: 8px 0 0;')
    expect(content).not.toContain('padding-inline: 16px;')
    expect(content).not.toContain('padding-left: 28px;')
  })

  it('shares wallet action row spacing with wallet card tokens', () => {
    const content = readFileSync(walletActionsPath, 'utf8')

    expect(content).toContain('--a-wallet-actions-item-padding-inline')
    expect(content).toContain('var(--a-wallet-card-item-padding-inline-start)')
    expect(content).not.toContain('--a-wallet-actions-item-padding-inline: 28px;')
  })
})
