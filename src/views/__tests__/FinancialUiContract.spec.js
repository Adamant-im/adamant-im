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

    expect(content).toContain('min-height: 56px;')
    expect(content).toContain('padding-top: 8px;')
    expect(content).toContain('padding-bottom: 8px;')
    expect(content).toContain('font-size: 14px;')
  })

  it('keeps transaction list item text styling in stylesheet, not inline attributes', () => {
    const content = readFileSync(transactionListItemPath, 'utf8')

    expect(content).toContain('__note-prefix')
    expect(content).toContain('__note-text')
    expect(content).toContain('--a-transaction-item-divider-inset')
    expect(content).not.toContain('style="font-style: italic"')
    expect(content).not.toContain('style="font-weight: 100"')
  })

  it('keeps stable typography for transaction details rows', () => {
    const content = readFileSync(transactionDetailsListItemPath, 'utf8')

    expect(content).toContain('font-size: 14px;')
  })
})
