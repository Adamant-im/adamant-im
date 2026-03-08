import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const containerPath = path.resolve(currentDir, '../../components/Container.vue')
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
