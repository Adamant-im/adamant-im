import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const walletsViewPath = path.resolve(currentDir, '../Wallets.vue')
const walletsListItemPath = path.resolve(currentDir, '../../components/wallets/WalletsListItem.vue')
const walletsSearchInputPath = path.resolve(
  currentDir,
  '../../components/wallets/WalletsSearchInput.vue'
)
const settingsTableShellPath = path.resolve(
  currentDir,
  '../../components/common/SettingsTableShell.vue'
)
const walletTabPath = path.resolve(currentDir, '../../components/WalletTab.vue')
const walletBalancePath = path.resolve(currentDir, '../../components/wallets/WalletBalance.vue')
const walletResetDialogPath = path.resolve(
  currentDir,
  '../../components/wallets/WalletResetDialog.vue'
)
const walletUiMetricsPath = path.resolve(
  currentDir,
  '../../components/wallets/helpers/uiMetrics.ts'
)
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')

describe('Wallets UI style contract', () => {
  it('uses shared settings shell for wallets screen layout without local scroll pane', () => {
    const content = readFileSync(walletsViewPath, 'utf8')
    const shellContent = readFileSync(settingsTableShellPath, 'utf8')

    expect(content).toContain('<SettingsTableShell :class="classes.layout">')
    expect(content).toContain('<template #before>')
    expect(content).toContain('<template #after>')
    expect(content).toContain('`${classes.root}__list`')
    expect(content).not.toContain("'a-scroll-pane'")
    expect(content).not.toContain('grid-template-rows: auto minmax(0, 1fr) auto;')
    expect(content).not.toContain('overflow: hidden;')
    expect(content).not.toContain('var(--a-layout-height)')
    expect(content).not.toContain('var(--a-layout-height-safe)')
    expect(content).not.toContain(':deep(.settings-table-shell__bleed)')
    expect(content).not.toContain('<v-card flat color="transparent"')
    expect(shellContent).toContain('--a-settings-table-shell-bleed-inline-start')
  })

  it('uses shared spacing variable for wallets footer review row', () => {
    const content = readFileSync(walletsViewPath, 'utf8')

    expect(content).toContain('--a-wallets-review-padding-block')
    expect(content).toContain('var(--a-wallets-review-padding-block)')
    expect(content).toContain('var(--a-space-4)')
    expect(content).not.toContain('padding-top: 15px !important;')
    expect(content).not.toContain('padding-bottom: 15px !important;')
  })

  it('uses tokenized paddings in wallets search input', () => {
    const content = readFileSync(walletsSearchInputPath, 'utf8')

    expect(content).toContain('--a-wallets-search-padding-inline')
    expect(content).toContain('var(--a-space-4)')
    expect(content).not.toContain('padding-left: 16px;')
    expect(content).not.toContain('padding-right: 16px;')
  })

  it('keeps wallet tab network marker styled via class, not inline style', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const content = readFileSync(walletTabPath, 'utf8')
    const metricsContent = readFileSync(walletUiMetricsPath, 'utf8')

    expect(tokensContent).toContain('--a-font-size-2xs')
    expect(tokensContent).toContain('--a-wallet-compact-line-height')
    expect(tokensContent).toContain('--a-wallet-compact-title-line-height')
    expect(tokensContent).toContain('--a-wallet-tab-icon-offset')
    expect(tokensContent).toContain('--a-wallet-tab-rates-offset')
    expect(tokensContent).toContain('--a-wallet-tab-content-min-height')
    expect(tokensContent).toContain('--a-wallet-tab-balance-to-ticker-offset')
    expect(tokensContent).toContain('--a-wallet-tab-network-label-size')
    expect(tokensContent).toContain('--a-wallet-tab-network-label-shift-x')
    expect(tokensContent).toContain('--a-wallet-tab-network-label-shift-y')
    expect(content).toContain('networkLabel')
    expect(content).toContain('networkRow')
    expect(content).toContain('ratesPlaceholder')
    expect(content).toContain('__network-label')
    expect(content).toContain('__network-row')
    expect(content).toContain('__rates-placeholder')
    expect(content).toContain('--a-wallet-tab-rates-color-dark')
    expect(content).toContain('var(--a-wallet-tab-icon-offset)')
    expect(content).toContain('var(--a-wallet-tab-rates-offset)')
    expect(content).toContain('var(--a-wallet-tab-content-min-height)')
    expect(content).toContain('var(--a-wallet-tab-balance-to-ticker-offset)')
    expect(content).toContain('var(--a-wallet-tab-network-label-size)')
    expect(content).toContain('var(--a-wallet-tab-network-label-shift-x)')
    expect(content).toContain('var(--a-wallet-tab-network-label-shift-y)')
    expect(content).toContain('var(--a-wallet-compact-line-height)')
    expect(content).toContain('var(--a-color-text-muted-dark)')
    expect(content).toContain('WALLET_TAB_LOADING_ICON_SIZE')
    expect(metricsContent).toContain('WALLET_TAB_LOADING_ICON_SIZE = 18')
    expect(content).toContain('<sub>ERC20</sub>')
    expect(content).not.toContain('style="font-size: 10px"')
    expect(content).not.toContain('--a-wallet-tab-network-label-size: 10px;')
    expect(content).not.toContain('--a-wallet-tab-content-min-height: 44px;')
    expect(content).not.toContain('hsla(0, 0%, 100%, 0.7)')
    expect(content).not.toContain('size="18"')
  })

  it('uses normalized size variables in wallets list item and balance row', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const listItemContent = readFileSync(walletsListItemPath, 'utf8')
    const balanceContent = readFileSync(walletBalancePath, 'utf8')
    const resetDialogContent = readFileSync(walletResetDialogPath, 'utf8')
    const metricsContent = readFileSync(walletUiMetricsPath, 'utf8')

    expect(tokensContent).toContain('--a-secondary-dialog-width')
    expect(tokensContent).toContain('--a-wallets-list-item-balance-offset-inline-end')
    expect(tokensContent).toContain('--a-wallets-list-item-checkbox-padding')
    expect(listItemContent).toContain('--a-wallets-list-item-content-height')
    expect(listItemContent).toContain('<v-list-item :class="classes.root">')
    expect(listItemContent).toContain('--a-wallets-list-item-content-gap')
    expect(listItemContent).toContain('classes.balance')
    expect(listItemContent).toContain('classes.checkboxControl')
    expect(listItemContent).toContain('WALLET_LIST_ICON_SIZE')
    expect(listItemContent).toContain('var(--a-control-size-md)')
    expect(listItemContent).toContain('var(--a-financial-stack-gap)')
    expect(listItemContent).toContain('--a-wallets-list-item-subtitle-weight')
    expect(listItemContent).toContain('--a-wallets-list-item-subtitle-muted-dark')
    expect(listItemContent).toContain('__crypto-subtitle-wrap')
    expect(listItemContent).toContain('var(--a-wallets-list-item-balance-offset-inline-end)')
    expect(listItemContent).toContain('var(--a-wallets-list-item-checkbox-padding)')
    expect(listItemContent).toContain('var(--a-wallet-compact-line-height)')
    expect(listItemContent).toContain('var(--a-wallet-compact-title-line-height)')
    expect(listItemContent).toContain('justify-content: center;')
    expect(listItemContent).toContain('gap: var(--a-wallets-list-item-content-gap);')
    expect(listItemContent).toContain('opacity: 1;')
    expect(listItemContent).toContain('var(--a-financial-text-font-weight)')
    expect(listItemContent).toContain('var(--a-color-text-muted-dark)')
    expect(listItemContent).not.toContain('justify-content: space-between;')
    expect(listItemContent).not.toContain('const iconSize = 32')
    expect(listItemContent).not.toContain('class="mr-2"')
    expect(listItemContent).not.toContain('class="pa-1"')
    expect(listItemContent).not.toContain('font-weight: 300;')
    expect(balanceContent).toContain('--a-wallet-balance-height')
    expect(balanceContent).toContain('--a-wallet-balance-gap')
    expect(balanceContent).toContain('--a-wallet-balance-status-font-weight')
    expect(balanceContent).toContain('--a-wallet-balance-status-color-dark')
    expect(balanceContent).toContain('var(--a-wallet-compact-line-height)')
    expect(balanceContent).toContain('var(--a-wallet-compact-title-line-height)')
    expect(balanceContent).toContain('var(--a-financial-stack-gap)')
    expect(balanceContent).toContain('var(--a-financial-text-font-weight)')
    expect(balanceContent).toContain('var(--a-color-text-muted-dark)')
    expect(balanceContent).toContain('var(--a-control-size-md)')
    expect(balanceContent).toContain('justify-content: center;')
    expect(balanceContent).not.toContain('height: 40px;')
    expect(balanceContent).not.toContain('--a-wallet-balance-gap: 8px;')
    expect(balanceContent).not.toContain('justify-content: flex-start;')
    expect(balanceContent).not.toContain('font-weight: 300;')
    expect(balanceContent).not.toContain('opacity: 0.7;')
    expect(metricsContent).toContain('WALLET_LIST_ICON_SIZE = 32')
    expect(resetDialogContent).toContain('width="var(--a-secondary-dialog-width)"')
    expect(resetDialogContent).not.toContain('width="500"')
  })
})
