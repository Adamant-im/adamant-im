import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const sendFundsFormPath = path.resolve(currentDir, '../../components/SendFundsForm.vue')
const inputStylesPath = path.resolve(currentDir, '../../assets/styles/themes/adamant/_inputs.scss')
const inputActionMenuMixinPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_input-action-menu.scss'
)
const transactionTemplatePath = path.resolve(
  currentDir,
  '../../components/transactions/TransactionTemplate.vue'
)
const transactionListItemPath = path.resolve(currentDir, '../../components/TransactionListItem.vue')
const transactionDetailsListItemPath = path.resolve(
  currentDir,
  '../../components/transactions/TransactionListItem.vue'
)
const splitDisplayByNamePath = path.resolve(
  currentDir,
  '../../components/transactions/utils/splitDisplayValueByName.ts'
)
const walletActionsPath = path.resolve(currentDir, '../../components/WalletCardListActions.vue')
const commonUiMetricsPath = path.resolve(currentDir, '../../components/common/helpers/uiMetrics.ts')
const transactionsViewPath = path.resolve(currentDir, '../Transactions.vue')
const baseIconPath = path.resolve(currentDir, '../../components/icons/BaseIcon.vue')
const layoutPrimitivesPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_layout-primitives.scss'
)
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const formActionLayoutPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_form-action-layout.scss'
)
const textContentPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_text-content.scss'
)
const colorRolesPath = path.resolve(currentDir, '../../assets/styles/components/_color-roles.scss')

describe('Financial UI style contract', () => {
  it('uses tokenized spacing and typography in send funds form', () => {
    const content = readFileSync(sendFundsFormPath, 'utf8')
    const fakeInputContent = readFileSync(inputStylesPath, 'utf8')
    const menuMixinContent = readFileSync(inputActionMenuMixinPath, 'utf8')
    const metricsContent = readFileSync(commonUiMetricsPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const formActionLayoutContent = readFileSync(formActionLayoutPath, 'utf8')
    const textContent = readFileSync(textContentPath, 'utf8')

    expect(content).toContain('--a-send-funds-button-margin-top')
    expect(content).toContain('--a-send-funds-amount-label-size')
    expect(content).toContain('--a-send-funds-field-label-font-weight')
    expect(tokensContent).toContain('--a-send-funds-amount-label-line-height')
    expect(content).toContain('--a-send-funds-confirm-spinner-gap')
    expect(content).toContain('__actions')
    expect(content).toContain('__field-label')
    expect(content).toContain('formActionLayout.a-form-actions-center()')
    expect(content).toContain('textContent.a-content-body-copy()')
    expect(content).toContain('COMMON_INLINE_SPINNER_SIZE')
    expect(content).toContain('inputActionMenu.a-input-action-menu()')
    expect(content).toContain('formatDisplayAmount(amount, currency)')
    expect(content).toContain('cryptoTransferDecimals')
    expect(content).toContain('.toFixed()')
    expect(content).toContain('__menu-list')
    expect(content).toContain('__menu-item')
    expect(content).toContain('__menu-item-title')
    expect(content).toContain('var(--a-space-4)')
    expect(content).toContain('var(--a-font-size-sm)')
    expect(metricsContent).toContain('COMMON_INLINE_SPINNER_SIZE = 24')
    expect(content).toContain('line-height: var(--a-send-funds-amount-label-line-height);')
    expect(content).not.toContain('class="mr-4"')
    expect(content).not.toContain('class="text-center"')
    expect(content).not.toContain('class="font-weight-medium"')
    expect(content).not.toContain('fake-input__value fake-input__value--rate a-text-regular')
    expect(content).not.toContain('.decimalPlaces(decimals).toString()')
    expect(content).not.toContain('size="24"')
    expect(content).not.toContain('margin-top: 15px;')

    expect(menuMixinContent).toContain('@mixin a-input-action-menu()')
    expect(menuMixinContent).toContain('var(--a-input-action-menu-list-padding-block)')
    expect(menuMixinContent).toContain('var(--a-input-action-menu-row-min-height)')
    expect(menuMixinContent).toContain('var(--a-input-action-menu-row-padding-block)')
    expect(menuMixinContent).toContain('var(--a-input-action-menu-item-padding-inline)')
    expect(menuMixinContent).toContain('var(--a-input-action-menu-title-font-size)')
    expect(menuMixinContent).toContain('var(--a-input-action-menu-title-line-height)')
    expect(menuMixinContent).toContain('font-weight: var(--a-font-weight-light);')

    expect(fakeInputContent).toContain('var(--a-fake-input-padding-top)')
    expect(fakeInputContent).toContain('var(--a-fake-input-margin-top)')
    expect(fakeInputContent).toContain('var(--a-fake-input-font-size)')
    expect(fakeInputContent).toContain('var(--a-fake-input-box-padding-bottom)')
    expect(fakeInputContent).toContain('var(--a-fake-input-value-line-height)')
    expect(fakeInputContent).toContain('var(--a-fake-input-rate-padding-inline-start)')
    expect(fakeInputContent).not.toContain('padding-top: 12px;')
    expect(fakeInputContent).not.toContain('margin-top: 4px;')
    expect(fakeInputContent).not.toContain('font-size: 16px;')
    expect(fakeInputContent).not.toContain('padding-bottom: 20px;')
    expect(fakeInputContent).not.toContain('line-height: 32px;')
    expect(fakeInputContent).not.toContain('padding-left: 3px;')

    expect(formActionLayoutContent).toContain('@mixin a-form-actions-center()')
    expect(textContent).toContain('@mixin a-content-body-copy()')
  })

  it('keeps stable row sizing in transaction template screens', () => {
    const content = readFileSync(transactionTemplatePath, 'utf8')
    const metricsContent = readFileSync(commonUiMetricsPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const colorRolesContent = readFileSync(colorRolesPath, 'utf8')

    expect(tokensContent).toContain('--a-color-status-attention')
    expect(tokensContent).toContain('--a-color-status-success')
    expect(tokensContent).toContain('--a-color-status-danger')
    expect(tokensContent).toContain('--a-color-text-regular')
    expect(tokensContent).toContain('--a-transaction-status-rotate-duration')
    expect(content).toContain(':class="[className, `${className}__list`]"')
    expect(content).toContain('COMMON_COMPACT_ICON_SIZE')
    expect(content).toContain('__invalid-status-icon')
    expect(content).toContain('var(--a-color-status-attention)')
    expect(content).toContain("@use '@/assets/styles/components/_color-roles.scss'")
    expect(content).toContain(
      "@include colorRoles.a-color-role-subtle-var('--a-transaction-view-value-muted-color');"
    )
    expect(content).toContain('--a-transaction-view-status-danger-color')
    expect(content).toContain('--a-transaction-view-status-success-color')
    expect(content).toContain('--a-transaction-view-status-attention-color')
    expect(content).toContain('var(--a-transaction-status-rotate-duration)')
    expect(content).toContain('--a-transaction-view-row-min-height')
    expect(content).toContain('--a-transaction-view-row-padding-block')
    expect(content).toContain('--a-transaction-view-row-padding-inline')
    expect(content).toContain('var(--a-list-row-min-height)')
    expect(content).toContain('var(--a-list-row-padding-block)')
    expect(content).toContain('var(--a-screen-padding-inline)')
    expect(content).toContain('min-height: var(--a-transaction-view-row-min-height);')
    expect(content).toContain('padding-top: var(--a-transaction-view-row-padding-block);')
    expect(content).toContain('padding-bottom: var(--a-transaction-view-row-padding-block);')
    expect(content).toContain('padding-inline: var(--a-transaction-view-row-padding-inline);')
    expect(content).toContain('font-size: var(--a-transaction-view-status-font-size);')
    expect(metricsContent).toContain('COMMON_COMPACT_ICON_SIZE = 20')
    expect(content).not.toContain('min-height: 56px;')
    expect(content).not.toContain('padding-top: 8px;')
    expect(content).not.toContain('padding-bottom: 8px;')
    expect(content).not.toContain('padding-inline: 24px;')
    expect(content).not.toContain('font-size: 14px;')
    expect(content).not.toContain('size="20"')
    expect(content).not.toContain('transition-duration: 1s;')
    expect(content).not.toContain('style="color: #f8a061 !important"')
    expect(content).not.toContain('color: var(--a-color-status-attention) !important;')
    expect(content).not.toContain("color: map.get(colors.$adm-colors, 'danger') !important;")
    expect(content).not.toContain("color: map.get(colors.$adm-colors, 'good') !important;")
    expect(colorRolesContent).toContain('@mixin a-color-role-subtle-var($var-name)')
  })

  it('keeps transaction list item text styling in stylesheet, not inline attributes', () => {
    const content = readFileSync(transactionListItemPath, 'utf8')

    expect(content).toContain('__note-prefix')
    expect(content).toContain('__note-text')
    expect(content).toContain('--a-transaction-item-amount-color')
    expect(content).toContain('--a-transaction-item-rates-color')
    expect(content).toContain('--a-transaction-item-icon-color')
    expect(content).toContain('--a-transaction-item-status-success-color')
    expect(content).toContain('--a-transaction-item-status-danger-color')
    expect(content).toContain('--a-transaction-item-divider-inset')
    expect(content).toContain('--a-transaction-item-padding-inline')
    expect(content).toContain('--a-transaction-item-rates-style')
    expect(content).toContain('var(--a-font-style-emphasis)')
    expect(content).toContain('--a-transaction-item-rates-color')
    expect(content).toContain('var(--a-screen-padding-inline)')
    expect(content).toContain("@use '@/assets/styles/components/_color-roles.scss'")
    expect(content).toContain(
      "@include colorRoles.a-color-role-supporting-var('--a-transaction-item-amount-color');"
    )
    expect(content).toContain(
      "@include colorRoles.a-color-role-subtle-var('--a-transaction-item-rates-color');"
    )
    expect(content).toContain('padding-inline: var(--a-transaction-item-padding-inline);')
    expect(content).not.toContain('style="font-style: italic"')
    expect(content).not.toContain('style="font-weight: 100"')
    expect(content).not.toContain('font-style: italic;')
    expect(content).not.toContain("color: map.get(colors.$adm-colors, 'regular') !important;")
    expect(content).not.toContain('padding-inline: 24px;')
    expect(content).not.toContain('hsla(0, 0%, 100%, 0.7)')
  })

  it('keeps stable typography for transaction details rows', () => {
    const content = readFileSync(transactionDetailsListItemPath, 'utf8')

    expect(content).toContain('<v-list-item :class="classes.root">')
    expect(content).toContain('--a-transaction-list-item-font-size')
    expect(content).toContain('--a-transaction-list-item-font-weight')
    expect(content).toContain('var(--a-financial-text-font-size)')
    expect(content).toContain('var(--a-financial-text-font-weight)')
    expect(content).toContain('font-size: var(--a-transaction-list-item-font-size);')
    expect(content).toContain('font-weight: var(--a-transaction-list-item-font-weight);')
    expect(content).toContain("color: map.get(colors.$adm-colors, 'regular');")
    expect(content).not.toContain('--a-transaction-list-item-value-color-dark')
    expect(content).not.toContain('font-size: 14px;')
    expect(content).not.toContain('font-weight: 300;')
  })

  it('keeps muted color only for fee equivalent and named address suffix in details', () => {
    const content = readFileSync(transactionTemplatePath, 'utf8')
    const splitContent = readFileSync(splitDisplayByNamePath, 'utf8')

    expect(content).toContain('calculatedFeeDisplay.fiat')
    expect(content).toContain('senderDisplay.muted')
    expect(content).toContain('recipientDisplay.muted')
    expect(content).toContain('__value-muted')
    expect(content).toContain('splitDisplayValueByName')
    expect(splitContent).toContain('main !== rawAddress || bracketAddress === rawAddress')
  })

  it('uses shared list row tokens in wallet actions list', () => {
    const content = readFileSync(walletActionsPath, 'utf8')

    expect(content).toContain('--a-wallet-actions-item-padding-inline')
    expect(content).toContain('--a-wallet-actions-row-min-height')
    expect(content).toContain('--a-wallet-actions-row-padding-block')
    expect(content).toContain('var(--a-wallet-card-item-padding-inline-start)')
    expect(content).toContain('var(--a-list-row-min-height)')
    expect(content).toContain('var(--a-list-row-padding-block)')
    expect(content).toContain('min-height: var(--a-wallet-actions-row-min-height);')
    expect(content).toContain('padding-top: var(--a-wallet-actions-row-padding-block);')
    expect(content).toContain('padding-bottom: var(--a-wallet-actions-row-padding-block);')
    expect(content).not.toContain('--a-wallet-actions-item-padding-inline: 28px;')
    expect(content).not.toContain('min-height: 56px;')
    expect(content).not.toContain('padding-top: 8px;')
    expect(content).not.toContain('padding-bottom: 8px;')
  })

  it('uses shared tokens for transactions loading row offset and base icon sizing', () => {
    const transactionsContent = readFileSync(transactionsViewPath, 'utf8')
    const iconContent = readFileSync(baseIconPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const layoutPrimitivesContent = readFileSync(layoutPrimitivesPath, 'utf8')

    expect(tokensContent).toContain('--a-transactions-loading-item-offset-top')
    expect(tokensContent).toContain('--a-transactions-loading-item-offset-top: 0;')
    expect(transactionsContent).toContain(
      "import { useAccountViewState } from '@/hooks/useAccountViewState'"
    )
    expect(transactionsContent).toContain('useAccountViewState()')
    expect(tokensContent).toContain('--a-icon-base-font-size')
    expect(tokensContent).toContain('--a-icon-box-centered-size')
    expect(tokensContent).toContain('--a-color-text-muted-light')

    expect(transactionsContent).toContain('top: var(--a-transactions-loading-item-offset-top);')
    expect(transactionsContent).toContain('&__empty-state')
    expect(transactionsContent).toContain('`${className}--list-loading`')
    expect(transactionsContent).toContain('!hasView && hasTransactions && isRecentLoading')
    expect(transactionsContent).toContain('&--list-loading')
    expect(transactionsContent).toContain('`${className}--detail-loading`')
    expect(transactionsContent).toContain('hasView && isRecentLoading')
    expect(transactionsContent).toContain('&--detail-loading')
    expect(transactionsContent).toContain('.transactions-view__loading-item--recent {')
    expect(transactionsContent).toContain('z-index: 1;')
    expect(transactionsContent).toContain('top: var(--a-space-12);')
    expect(transactionsContent).not.toContain('top: 20px;')
    expect(transactionsContent).not.toContain('class="a-text-caption text-center mt-6"')

    expect(iconContent).toContain('font-size: var(--a-icon-base-font-size);')
    expect(iconContent).toContain('width: var(--a-icon-box-centered-size);')
    expect(iconContent).toContain('height: var(--a-icon-box-centered-size);')
    expect(layoutPrimitivesContent).toContain('@mixin a-flex-center()')
    expect(layoutPrimitivesContent).toContain('justify-content: center;')
    expect(iconContent).toContain("@use '@/assets/styles/components/_layout-primitives.scss'")
    expect(iconContent).toContain('@include layoutPrimitives.a-flex-center();')
    expect(iconContent).toContain('fill: var(--a-color-text-muted-light);')
    expect(iconContent).toContain('stroke: var(--a-color-text-muted-light);')
    expect(iconContent).not.toContain('font-size: 24px;')
    expect(iconContent).not.toContain('width: 40px;')
    expect(iconContent).not.toContain('height: 40px;')
    expect(iconContent).not.toContain('fill: rgba(0, 0, 0, 0.54);')
    expect(iconContent).not.toContain('stroke: rgba(0, 0, 0, 0.54);')
  })

  it('manages scroll listeners with keep-alive lifecycle in Transactions view', () => {
    const content = readFileSync(transactionsViewPath, 'utf8')

    expect(content).toContain('onActivated')
    expect(content).toContain('onDeactivated')
    expect(content).toContain('const addScrollListener = () => {')
    expect(content).toContain('const removeScrollListener = () => {')
    expect(content).toContain('addScrollListener()')
    expect(content).toContain('removeScrollListener()')
  })

  it('refetches transactions when crypto prop changes in Transactions view', () => {
    const content = readFileSync(transactionsViewPath, 'utf8')

    expect(content).toContain('() => props.crypto')
    expect(content).toContain('if (newCrypto !== oldCrypto) {')
    expect(content).toContain('isFulfilled.value = false')
    expect(content).toContain('getNewTransactions()')
  })

  it('supports force refresh via store flag for Balance click', () => {
    const content = readFileSync(transactionsViewPath, 'utf8')

    expect(content).toContain('store.state.options.forceTransactionsRefresh')
    expect(content).toContain(
      "store.commit('options/updateOption', { key: 'forceTransactionsRefresh', value: false })"
    )
    expect(content).toContain('sidebarLayoutRef?.value?.scrollTo({ top: 0 })')
  })

  it('guards getNewTransactions against stale crypto fetch completion', () => {
    const content = readFileSync(transactionsViewPath, 'utf8')

    expect(content).toContain('const fetchingCrypto = cryptoModule.value')
    expect(content).toContain('if (cryptoModule.value === fetchingCrypto) {')
    expect(content).toContain('if (cryptoModule.value !== fetchingCrypto) return')
  })

  it('syncs SendFundsForm currency with store currentWallet', () => {
    const content = readFileSync(sendFundsFormPath, 'utf8')

    expect(content).toContain('this.$store.state.options.currentWallet !== this.currency')
    expect(content).toContain("key: 'currentWallet'")
    expect(content).toContain('() => this.$store.state.options.currentWallet')
    expect(content).toContain('this.cryptoList.includes(newVal)')
    expect(content).toContain(':readonly="addressReadonly"')
    expect(content).toContain('--a-send-funds-actions-padding-bottom')
    expect(content).toContain('padding-bottom: var(--a-send-funds-actions-padding-bottom);')
  })
})
