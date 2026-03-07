import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const votesPath = path.resolve(currentDir, '../Votes.vue')
const settingsTableShellPath = path.resolve(
  currentDir,
  '../../components/common/SettingsTableShell.vue'
)
const settingsDataTablePath = path.resolve(
  currentDir,
  '../../components/common/SettingsDataTable.vue'
)
const delegatesTablePath = path.resolve(
  currentDir,
  '../../components/DelegatesTable/DelegatesTable.vue'
)
const delegatesTableHeadPath = path.resolve(
  currentDir,
  '../../components/DelegatesTable/DelegatesTableHead.vue'
)
const delegatesTableItemPath = path.resolve(
  currentDir,
  '../../components/DelegatesTable/DelegatesTableItem.vue'
)

describe('Votes UI style contract', () => {
  it('uses shared settings table shell for delegates screen layout', () => {
    const votesContent = readFileSync(votesPath, 'utf8')
    const shellContent = readFileSync(settingsTableShellPath, 'utf8')

    expect(votesContent).toContain('<SettingsTableShell :class="`${className}__layout`">')
    expect(votesContent).toContain('<template #before>')
    expect(votesContent).toContain('<template #after>')
    expect(votesContent).toContain('padding: var(--a-space-5) 0;')
    expect(votesContent).toContain('padding-top: var(--a-space-4) !important;')
    expect(votesContent).toContain('padding-bottom: var(--a-space-4) !important;')
    expect(votesContent).not.toContain('padding: 20px 16px !important;')
    expect(votesContent).not.toContain('padding-top: 15px !important;')
    expect(shellContent).toContain('--a-settings-table-shell-bleed-inline-start')
    expect(shellContent).toContain('--a-settings-table-shell-bleed-inline-end')
  })

  it('uses shared data table surface and tokenized delegates table cells', () => {
    const tableContent = readFileSync(delegatesTablePath, 'utf8')
    const dataTableContent = readFileSync(settingsDataTablePath, 'utf8')
    const headContent = readFileSync(delegatesTableHeadPath, 'utf8')
    const itemContent = readFileSync(delegatesTableItemPath, 'utf8')

    expect(tableContent).toContain('<SettingsDataTable :class="classes.root">')
    expect(dataTableContent).toContain('--a-settings-data-table-line-height')
    expect(headContent).toContain('--a-delegates-table-head-font-size')
    expect(headContent).toContain('--a-delegates-table-head-padding-inline-end')
    expect(headContent).toContain('--a-delegates-table-head-padding-inline-start-primary')
    expect(headContent).toContain('var(--a-font-size-xs)')
    expect(headContent).toContain('var(--a-space-2)')
    expect(headContent).toContain('var(--a-space-4)')
    expect(headContent).not.toContain('class="pl-4 pr-2"')
    expect(headContent).not.toContain('class="pl-0 pr-2"')
    expect(headContent).not.toContain('font-size: 12px;')

    expect(itemContent).toContain('--a-delegates-table-item-font-size')
    expect(itemContent).toContain('--a-delegates-table-item-padding-inline-end')
    expect(itemContent).toContain('--a-delegates-table-item-padding-inline-start-primary')
    expect(itemContent).toContain('var(--a-font-size-sm)')
    expect(itemContent).toContain('var(--a-space-2)')
    expect(itemContent).toContain('var(--a-space-4)')
    expect(itemContent).not.toContain('class="pl-4 pr-2"')
    expect(itemContent).not.toContain('class="pl-0 pr-2"')
    expect(itemContent).not.toContain('font-size: 14px;')
  })
})
