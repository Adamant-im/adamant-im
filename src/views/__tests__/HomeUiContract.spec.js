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
const colorRolesPath = path.resolve(currentDir, '../../assets/styles/components/_color-roles.scss')

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
    expect(content).toContain('--a-color-surface-soft-light')
    expect(content).toContain('--a-color-border-soft-light')
    expect(content).toContain('calc(var(--a-space-6) + var(--a-space-1))')
    expect(content).toContain('var(--a-space-4)')
    expect(content).toContain('var(--a-line-height-md)')
  })

  it('uses tokenized wallet tabs spacing and sizing variables', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const content = readFileSync(homePath, 'utf8')

    expect(content).toContain('<v-row justify="center" :class="className">')
    expect(content).toContain(':key="walletTabsKey"')
    expect(content).toContain(':key="walletWindowKey"')
    expect(content).toContain(':hide-fiat-rates="allWalletBalancesZero"')
    expect(content).toContain('const walletOrderKey = computed(() => {')
    expect(content).toContain('const walletTabsKey = computed(() => {')
    expect(content).toContain('const walletWindowKey = computed(() => {')
    expect(content).toContain(
      'const walletState = crypto.symbol === Cryptos.ADM ? null : state[key]'
    )
    expect(content).toContain("walletState?.address || ''")
    expect(content).toContain('walletState?.balance || 0')
    expect(content).toContain(
      "orderedVisibleWalletSymbols.value.map((wallet: CoinSymbol) => wallet.symbol).join(',')"
    )
    expect(content).toContain('return `tabs-${walletOrderKey.value}`')
    expect(content).toContain('return `window-${walletOrderKey.value}`')
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
    expect(content).toContain('var(--a-color-surface-soft-light)')
    expect(content).toContain('var(--a-radius-round)')
    expect(content).not.toContain(
      "background-color: map.get(colors.$adm-colors, 'primary') !important;"
    )

    expect(content).not.toContain('font-size: 16px;')
    expect(content).not.toContain('flex-basis: 32px;')
    expect(content).not.toContain('min-width: 32px;')
    expect(content).not.toContain('font-weight: 300;')
    expect(content).not.toContain('font-weight: 500;')
    expect(content).not.toContain('letter-spacing: normal;')
    expect(content).not.toContain('padding-top: 10px;')
    expect(content).not.toContain('margin-bottom: 10px;')
    expect(content).not.toContain('min-width: 84px;')
    expect(content).not.toContain('no-gutters')
    expect(content).not.toContain('class="justify-center v-row--no-gutters"')
  })

  it('uses shared wallet card spacing and typography tokens', () => {
    const content = readFileSync(walletCardPath, 'utf8')
    const colorRolesContent = readFileSync(colorRolesPath, 'utf8')

    expect(content).toContain('walletCardActions: `${className}__actions`')
    expect(content).toContain('walletCardBrandTitle')
    expect(content).toContain('<WalletCardListActions :class="classes.walletCardActions"')
    expect(content).toContain('hideFiatRates?: boolean')
    expect(content).toContain('const showFiatRate = computed(() => {')
    expect(content).toContain('const isAdamantWallet = computed(() => {')
    expect(content).toContain("t('home.wallet_crypto_adamant_prefix')")
    expect(content).toContain("t('home.wallet_crypto_adamant_suffix')")
    expect(content).toContain('!props.hideFiatRates && store.state.rate.isLoaded')
    expect(content).toContain('--a-wallet-card-title-color')
    expect(content).toContain('--a-wallet-card-subtitle-color')
    expect(content).toContain('--a-wallet-card-action-color')
    expect(content).toContain('letter-spacing: var(--a-letter-spacing-caps-small);')
    expect(content).toContain('var(--a-color-surface-transparent)')
    expect(content).toContain('var(--a-wallet-card-subtitle-line-height)')
    expect(content).toContain('var(--a-font-style-emphasis)')
    expect(content).toContain("@use '@/assets/styles/components/_color-roles.scss'")
    expect(content).toContain(
      "@include colorRoles.a-color-role-primary-surface-var('--a-wallet-card-title-color');"
    )
    expect(content).toContain(
      "@include colorRoles.a-color-role-subtle-var('--a-wallet-card-subtitle-color');"
    )
    expect(content).toContain('var(--a-wallet-card-list-padding-top)')
    expect(content).toContain('var(--a-wallet-card-item-padding-inline-start)')
    expect(content).toContain('var(--a-wallet-card-item-padding-inline-end)')
    expect(content).not.toContain('<WalletCardListActions :class="classes.walletCardList"')
    expect(content).not.toContain('line-height: 24px;')
    expect(content).not.toContain('font-style: italic;')
    expect(content).not.toContain('padding: 8px 0 0;')
    expect(content).not.toContain('padding-inline: 16px;')
    expect(content).not.toContain('padding-left: 28px;')
    expect(content).not.toContain("rgba(map.get(settings.$shades, 'white'), 70%)")
    expect(colorRolesContent).toContain('@mixin a-color-role-primary-surface-var($var-name)')
    expect(colorRolesContent).toContain('var(--a-color-text-regular)')
    expect(colorRolesContent).toContain('var(--a-color-text-muted-light)')
    expect(colorRolesContent).toContain('var(--a-color-text-inverse)')
    expect(colorRolesContent).toContain('var(--a-color-text-muted-dark)')
  })

  it('shares wallet action row spacing with wallet card tokens', () => {
    const content = readFileSync(walletActionsPath, 'utf8')
    const metricsContent = readFileSync(walletUiMetricsPath, 'utf8')

    expect(content).toContain('--a-wallet-actions-item-padding-inline')
    expect(content).toContain('--a-wallet-actions-title-color')
    expect(content).toContain('--a-wallet-actions-icon-color')
    expect(content).toContain('--a-wallet-actions-icon-opacity')
    expect(content).toContain('WALLET_ACTION_STAKE_ICON_SIZE')
    expect(content).toContain('var(--a-wallet-card-item-padding-inline-start)')
    expect(content).toContain('opacity: var(--a-wallet-actions-icon-opacity);')
    expect(content).toContain("@use '@/assets/styles/components/_color-roles.scss'")
    expect(content).toContain(
      "@include colorRoles.a-color-role-primary-surface-var('--a-wallet-actions-title-color');"
    )
    expect(content).toContain(
      "@include colorRoles.a-color-role-primary-surface-var('--a-wallet-actions-icon-color');"
    )
    expect(content).toContain("path: '/votes'")
    expect(content).toContain("store.commit('options/setSettingsLastRoute', '/votes')")
    expect(content).toContain('forceResetSettingsView: true')
    expect(metricsContent).toContain('WALLET_ACTION_STAKE_ICON_SIZE = 24')
    expect(content).not.toContain('--a-wallet-actions-item-padding-inline: 28px;')
    expect(content).not.toContain('<icon :width="24" :height="24">')
    expect(content).not.toContain('opacity: unset;')
  })

  it('highlights Balance menu item when on a transactions route', () => {
    const content = readFileSync(walletCardPath, 'utf8')

    expect(content).toContain("import { useRoute } from 'vue-router'")
    expect(content).toContain('const route = useRoute()')
    expect(content).toContain(':active="isBalanceActive"')
    expect(content).toContain("route.name === 'Transactions' || route.name === 'Transaction'")
    expect(content).toContain('route.params.crypto === props.crypto')
    expect(content).toContain('@include mixins.linear-gradient-light-gray()')
    expect(content).toContain('@include mixins.linear-gradient-dark-soft()')
    expect(content).toContain('> .v-list-item__overlay')
  })

  it('highlights Send Funds and Stake items based on active route', () => {
    const content = readFileSync(walletActionsPath, 'utf8')

    expect(content).toContain("import { useRoute, useRouter } from 'vue-router'")
    expect(content).toContain('const route = useRoute()')
    expect(content).toContain(':active="isSendActive"')
    expect(content).toContain(':active="isStakeActive"')
    expect(content).toContain("route.name === 'SendFunds'")
    expect(content).toContain('store.state.options.currentWallet === props.crypto')
    expect(content).toContain("route.name === 'Votes'")
  })

  it('forces scroll to top and fresh data on Balance click', () => {
    const content = readFileSync(homePath, 'utf8')

    expect(content).toContain("store.commit('options/setAccountScrollPosition', { path, top: 0 })")
    expect(content).toContain(
      "store.commit('options/updateOption', { key: 'forceTransactionsRefresh', value: true })"
    )
  })

  it('does not navigate away from SendFunds when currentWallet changes', () => {
    const content = readFileSync(homePath, 'utf8')

    expect(content).not.toContain("router.push({\n      name: 'Home'\n    })")
    expect(content).not.toContain("name: 'Home'\n    }")
  })

  it('guards currentWallet watcher against falsy values and same-crypto re-navigation', () => {
    const content = readFileSync(homePath, 'utf8')

    expect(content).toContain('if (!value) return')
    expect(content).toContain('const currentCrypto = route.params.crypto')
    expect(content).toContain('if (currentCrypto === value) return')
  })
})
