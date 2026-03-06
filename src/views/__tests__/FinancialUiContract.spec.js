import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const sendFundsFormPath = path.resolve(currentDir, '../../components/SendFundsForm.vue')
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

describe('Financial UI style contract', () => {
  it('uses tokenized spacing and typography in send funds form', () => {
    const content = readFileSync(sendFundsFormPath, 'utf8')

    expect(content).toContain('--a-send-funds-button-margin-top')
    expect(content).toContain('--a-send-funds-amount-label-size')
    expect(content).toContain('var(--a-space-4)')
    expect(content).toContain('var(--a-font-size-sm)')
    expect(content).not.toContain('margin-top: 15px;')
  })

  it('keeps stable row sizing in transaction template screens', () => {
    const content = readFileSync(transactionTemplatePath, 'utf8')

    expect(content).toContain(':class="[className, `${className}__list`]"')
    expect(content).toContain('--a-transaction-view-row-min-height')
    expect(content).toContain('--a-transaction-view-row-padding-block')
    expect(content).toContain('var(--a-list-row-min-height)')
    expect(content).toContain('var(--a-list-row-padding-block)')
    expect(content).toContain('min-height: var(--a-transaction-view-row-min-height);')
    expect(content).toContain('padding-top: var(--a-transaction-view-row-padding-block);')
    expect(content).toContain('padding-bottom: var(--a-transaction-view-row-padding-block);')
    expect(content).toContain('font-size: var(--a-transaction-view-status-font-size);')
    expect(content).not.toContain('min-height: 56px;')
    expect(content).not.toContain('padding-top: 8px;')
    expect(content).not.toContain('padding-bottom: 8px;')
    expect(content).not.toContain('font-size: 14px;')
  })

  it('keeps transaction list item text styling in stylesheet, not inline attributes', () => {
    const content = readFileSync(transactionListItemPath, 'utf8')

    expect(content).toContain('__note-prefix')
    expect(content).toContain('__note-text')
    expect(content).toContain('--a-transaction-item-divider-inset')
    expect(content).toContain('--a-transaction-item-rates-color-dark')
    expect(content).toContain('var(--a-color-text-muted-dark)')
    expect(content).not.toContain('style="font-style: italic"')
    expect(content).not.toContain('style="font-weight: 100"')
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
    expect(content).toContain("color: map.get(colors.$adm-colors, 'regular') !important;")
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
    expect(content).toContain('var(--a-color-text-muted-dark)')
  })

  it('uses shared list row tokens in wallet actions list', () => {
    const content = readFileSync(walletActionsPath, 'utf8')

    expect(content).toContain('--a-wallet-actions-row-min-height')
    expect(content).toContain('--a-wallet-actions-row-padding-block')
    expect(content).toContain('var(--a-list-row-min-height)')
    expect(content).toContain('var(--a-list-row-padding-block)')
    expect(content).toContain('min-height: var(--a-wallet-actions-row-min-height);')
    expect(content).toContain('padding-top: var(--a-wallet-actions-row-padding-block);')
    expect(content).toContain('padding-bottom: var(--a-wallet-actions-row-padding-block);')
    expect(content).not.toContain('min-height: 56px;')
    expect(content).not.toContain('padding-top: 8px;')
    expect(content).not.toContain('padding-bottom: 8px;')
  })
})
