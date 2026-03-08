import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const homePath = path.resolve(currentDir, '../Home.vue')
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const walletCardPath = path.resolve(currentDir, '../../components/WalletCard.vue')
const walletActionsPath = path.resolve(currentDir, '../../components/WalletCardListActions.vue')
const walletUiMetricsPath = path.resolve(
  currentDir,
  '../../components/wallets/helpers/uiMetrics.ts'
)

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
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const content = readFileSync(homePath, 'utf8')

    expect(tokensContent).toContain('--a-account-tabs-slider-height')
    expect(tokensContent).toContain('--a-account-tabs-padding-top')
    expect(tokensContent).toContain('--a-account-tabs-padding-bottom')
    expect(tokensContent).toContain('--a-account-tabs-margin-bottom')
    expect(tokensContent).toContain('--a-account-tab-font-size')
    expect(tokensContent).toContain('--a-account-tab-font-weight')
    expect(tokensContent).toContain('--a-account-tab-font-weight-selected')
    expect(tokensContent).toContain('--a-account-tab-letter-spacing')
    expect(tokensContent).toContain('--a-account-tab-padding-block')
    expect(tokensContent).toContain('--a-account-tab-padding-inline')
    expect(tokensContent).toContain('--a-account-tab-min-width')
    expect(tokensContent).toContain('--a-account-tab-affix-width')
    expect(tokensContent).toContain('--a-account-tab-icon-offset')
    expect(tokensContent).toContain('calc(var(--a-space-5) / 2)')
    expect(tokensContent).toContain('calc((var(--a-control-size-md) * 2) + var(--a-space-1))')
    expect(tokensContent).toContain('calc(var(--a-space-3) / 4)')
    expect(content).toContain('var(--a-account-tabs-slider-height)')
    expect(content).toContain('var(--a-account-tabs-padding-top)')
    expect(content).toContain('var(--a-account-tabs-padding-bottom)')
    expect(content).toContain('var(--a-account-tabs-margin-bottom)')
    expect(content).toContain('var(--a-account-tab-font-size)')
    expect(content).toContain('var(--a-account-tab-font-weight)')
    expect(content).toContain('var(--a-account-tab-font-weight-selected)')
    expect(content).toContain('var(--a-account-tab-letter-spacing)')
    expect(content).toContain('var(--a-account-tab-padding-block)')
    expect(content).toContain('var(--a-account-tab-padding-inline)')
    expect(content).toContain('var(--a-account-tab-min-width)')
    expect(content).toContain('var(--a-account-tab-affix-width)')
    expect(content).toContain('var(--a-account-tab-icon-offset)')
    expect(content).toContain('var(--a-radius-round)')

    expect(content).not.toContain('font-size: 16px;')
    expect(content).not.toContain('flex-basis: 32px;')
    expect(content).not.toContain('min-width: 32px;')
    expect(content).not.toContain('font-weight: 300;')
    expect(content).not.toContain('font-weight: 500;')
    expect(content).not.toContain('letter-spacing: normal;')
    expect(content).not.toContain('padding-top: 10px;')
    expect(content).not.toContain('margin-bottom: 10px;')
    expect(content).not.toContain('min-width: 84px;')
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
    const metricsContent = readFileSync(walletUiMetricsPath, 'utf8')

    expect(content).toContain('--a-wallet-actions-item-padding-inline')
    expect(content).toContain('WALLET_ACTION_STAKE_ICON_SIZE')
    expect(content).toContain('var(--a-wallet-card-item-padding-inline-start)')
    expect(metricsContent).toContain('WALLET_ACTION_STAKE_ICON_SIZE = 24')
    expect(content).not.toContain('--a-wallet-actions-item-padding-inline: 28px;')
    expect(content).not.toContain('<icon :width="24" :height="24">')
  })
})
