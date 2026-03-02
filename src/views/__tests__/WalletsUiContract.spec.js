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
const walletTabPath = path.resolve(currentDir, '../../components/WalletTab.vue')
const walletBalancePath = path.resolve(currentDir, '../../components/wallets/WalletBalance.vue')

describe('Wallets UI style contract', () => {
  it('uses shared spacing variable for wallets footer review row', () => {
    const content = readFileSync(walletsViewPath, 'utf8')

    expect(content).toContain('--a-wallets-review-padding-block')
    expect(content).toContain('var(--a-wallets-review-padding-block)')
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
    const content = readFileSync(walletTabPath, 'utf8')

    expect(content).toContain('networkLabel')
    expect(content).toContain('networkRow')
    expect(content).toContain('ratesPlaceholder')
    expect(content).toContain('__network-label')
    expect(content).toContain('__network-row')
    expect(content).toContain('__rates-placeholder')
    expect(content).toContain('<sub>ERC20</sub>')
    expect(content).not.toContain('style="font-size: 10px"')
  })

  it('uses normalized size variables in wallets list item and balance row', () => {
    const listItemContent = readFileSync(walletsListItemPath, 'utf8')
    const balanceContent = readFileSync(walletBalancePath, 'utf8')

    expect(listItemContent).toContain('--a-wallets-list-item-content-height')
    expect(listItemContent).toContain('var(--a-control-size-md)')
    expect(balanceContent).toContain('--a-wallet-balance-height')
    expect(balanceContent).toContain('--a-wallet-balance-gap')
    expect(balanceContent).toContain('var(--a-control-size-md)')
    expect(balanceContent).toContain('justify-content: flex-start;')
    expect(balanceContent).not.toContain('height: 40px;')
  })
})
