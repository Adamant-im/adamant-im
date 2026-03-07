import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const layoutVariablesPath = path.resolve(currentDir, '../../assets/styles/generic/_variables.scss')
const layoutScssPath = path.resolve(currentDir, '../../assets/styles/generic/_layout.scss')
const appSidebarPath = path.resolve(currentDir, '../AppSidebar.vue')
const chatsPath = path.resolve(currentDir, '../../components/Chat/Chats.vue')
const walletsPath = path.resolve(currentDir, '../Wallets.vue')
const sendFundsPath = path.resolve(currentDir, '../SendFunds.vue')
const transactionTemplatePath = path.resolve(
  currentDir,
  '../../components/transactions/TransactionTemplate.vue'
)

describe('Split layout style contract', () => {
  it('defines safe fallback for layout height variables', () => {
    const content = readFileSync(layoutVariablesPath, 'utf8')

    expect(content).toContain('--a-layout-bottom: 0px;')
    expect(content).toContain('--a-layout-height: calc(100vh - var(--a-layout-bottom));')
    expect(content).toContain('100vh - var(--a-layout-bottom) - var(--a-safe-area-bottom)')
  })

  it('maps layout height variables to vuetify layout context', () => {
    const content = readFileSync(layoutScssPath, 'utf8')

    expect(content).toContain('.v-main,')
    expect(content).toContain('--a-layout-bottom: var(--v-layout-bottom, 0px);')
    expect(content).toContain('--a-layout-height: calc(100vh - var(--a-layout-bottom));')
  })

  it('defines a shared split-pane scroll utility', () => {
    const content = readFileSync(layoutScssPath, 'utf8')

    expect(content).toContain('.a-scroll-pane')
    expect(content).toContain('overflow-y: auto;')
    expect(content).toContain('overflow-x: hidden;')
    expect(content).toContain('overscroll-behavior: contain;')
  })

  it('keeps sidebar pane bound to shared layout height tokens and utility class', () => {
    const content = readFileSync(appSidebarPath, 'utf8')

    expect(content).toContain('height: var(--a-layout-height);')
    expect(content).toContain('height: var(--a-layout-height-safe);')
    expect(content).toContain("'a-scroll-pane'")
  })

  it('uses shared split-pane utility in chats list pane', () => {
    const content = readFileSync(chatsPath, 'utf8')

    expect(content).toContain('class="a-scroll-pane"')
  })

  it('keeps wallets screen on the shared sidebar scroll instead of a local pane', () => {
    const content = readFileSync(walletsPath, 'utf8')

    expect(content).not.toContain("'a-scroll-pane'")
    expect(content).not.toContain('var(--a-layout-height)')
    expect(content).not.toContain('var(--a-layout-height-safe)')
  })

  it('removes legacy fixed-height scroll wrappers from send funds and transaction template', () => {
    const sendFundsContent = readFileSync(sendFundsPath, 'utf8')
    const transactionTemplateContent = readFileSync(transactionTemplatePath, 'utf8')
    const legacyHeightExpression = 'calc(100vh - var(--v-layout-bottom) - var(--toolbar-height))'

    expect(sendFundsContent).not.toContain('&__content')
    expect(transactionTemplateContent).not.toContain('&__content')
    expect(sendFundsContent).not.toContain(legacyHeightExpression)
    expect(transactionTemplateContent).not.toContain(legacyHeightExpression)
  })
})
