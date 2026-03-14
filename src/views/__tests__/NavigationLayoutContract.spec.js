import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const containerPath = path.resolve(currentDir, '../../components/Container.vue')
const chatLayoutPath = path.resolve(currentDir, '../../layouts/chat.vue')
const toolbarLayoutPath = path.resolve(currentDir, '../../layouts/toolbar.vue')
const settingsTableShellPath = path.resolve(
  currentDir,
  '../../components/common/SettingsTableShell.vue'
)
const transactionsViewPath = path.resolve(currentDir, '../Transactions.vue')
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')

describe('Navigation layout contract', () => {
  it('uses shared symmetric mobile gutters in the padded navigation container', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const content = readFileSync(containerPath, 'utf8')

    expect(tokensContent).toContain('--a-layout-content-max-width')
    expect(content).toContain('max-width: var(--a-layout-content-max-width);')
    expect(content).toContain('padding-inline: var(--a-space-6);')
    expect(content).not.toContain('max-width: 800px;')
    expect(content).not.toContain('padding: 0 16px 0 24px;')
  })

  it('uses semantic layout classes instead of padding utility classes in chat and toolbar layouts', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const chatContent = readFileSync(chatLayoutPath, 'utf8')
    const toolbarContent = readFileSync(toolbarLayoutPath, 'utf8')

    expect(tokensContent).toContain('--a-toolbar-layout-padding')
    expect(chatContent).toContain("const className = 'chat-layout'")
    expect(chatContent).toContain(':class="`${className}__container`"')
    expect(chatContent).toContain('padding: 0;')
    expect(chatContent).not.toContain('class="pa-0"')

    expect(toolbarContent).toContain("const className = 'toolbar-layout'")
    expect(toolbarContent).toContain(
      ':class="[className, { [`${className}--flush`]: containerNoPadding }]"'
    )
    expect(toolbarContent).toContain('padding: var(--a-toolbar-layout-padding);')
    expect(toolbarContent).toContain('&--flush')
    expect(toolbarContent).not.toContain("'pa-6': !containerNoPadding")
    expect(toolbarContent).not.toContain("'pa-0': containerNoPadding")
  })

  it('uses shared bleed gutters in the settings table shell without mobile compensation', () => {
    const content = readFileSync(settingsTableShellPath, 'utf8')

    expect(content).toContain('--a-settings-table-shell-bleed-inline-start: var(--a-space-6);')
    expect(content).toContain('--a-settings-table-shell-bleed-inline-end: var(--a-space-6);')
    expect(content).not.toContain('--a-settings-table-shell-bleed-inline-end: var(--a-space-4);')
  })

  it('keeps transaction list/details screens on the full-bleed content pattern', () => {
    const content = readFileSync(transactionsViewPath, 'utf8')

    expect(content).toContain(':content-padding="false"')
  })
})
