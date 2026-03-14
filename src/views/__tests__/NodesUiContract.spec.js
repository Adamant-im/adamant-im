import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const nodesTablePath = path.resolve(currentDir, '../../components/nodes/NodesTable.vue')
const settingsTableShellPath = path.resolve(
  currentDir,
  '../../components/common/SettingsTableShell.vue'
)
const settingsDataTablePath = path.resolve(
  currentDir,
  '../../components/common/SettingsDataTable.vue'
)
const nodeColumnPath = path.resolve(currentDir, '../../components/nodes/components/NodeColumn.vue')
const nodeStatusPath = path.resolve(currentDir, '../../components/nodes/components/NodeStatus.vue')
const nodeStatusCheckboxPath = path.resolve(
  currentDir,
  '../../components/nodes/components/NodeStatusCheckbox.vue'
)
const nodeStatusUiMetricsPath = path.resolve(
  currentDir,
  '../../components/nodes/helpers/uiMetrics.ts'
)
const nodeLabelPath = path.resolve(currentDir, '../../components/nodes/components/NodeLabel.vue')
const nodeUrlPath = path.resolve(currentDir, '../../components/nodes/components/NodeUrl.vue')
const nodeVersionPath = path.resolve(
  currentDir,
  '../../components/nodes/components/NodeVersion.vue'
)
const nodesTableHeadPath = path.resolve(
  currentDir,
  '../../components/nodes/components/NodesTableHead.vue'
)
const admNodesTableItemPath = path.resolve(
  currentDir,
  '../../components/nodes/adm/AdmNodesTableItem.vue'
)
const layoutPrimitivesPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_layout-primitives.scss'
)
const ipfsNodesTableItemPath = path.resolve(
  currentDir,
  '../../components/nodes/ipfs/IpfsNodesTableItem.vue'
)
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const textContentPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_text-content.scss'
)

describe('Nodes UI style contract', () => {
  it('uses shared settings table shell with shared mobile bleed gutters', () => {
    const content = readFileSync(nodesTablePath, 'utf8')
    const shellContent = readFileSync(settingsTableShellPath, 'utf8')
    const textContent = readFileSync(textContentPath, 'utf8')

    expect(content).toContain('<SettingsTableShell :class="classes.root">')
    expect(content).toContain('checkboxSection')
    expect(content).toContain('description')
    expect(shellContent).toContain('--a-settings-table-shell-bleed-inline-start')
    expect(shellContent).toContain('--a-settings-table-shell-bleed-inline-end')
    expect(shellContent).toContain('--a-settings-table-shell-section-inline-start: 0px;')
    expect(shellContent).toContain('--a-settings-table-shell-section-inline-end: 0px;')
    expect(shellContent).toContain('--a-settings-table-shell-checkbox-offset')
    expect(shellContent).toContain('var(--a-space-6)')
    expect(content).toContain('textContent.a-content-explanatory-copy()')
    expect(content).toContain('textContent.a-content-inline-links()')
    expect(shellContent).toContain(
      'margin-inline-start: calc(var(--a-settings-table-shell-bleed-inline-start) * -1);'
    )
    expect(shellContent).toContain(
      'margin-inline-end: calc(var(--a-settings-table-shell-bleed-inline-end) * -1);'
    )
    expect(shellContent).not.toContain('margin-left: -24px;')
    expect(shellContent).not.toContain('margin-right: -24px;')
    expect(shellContent).not.toContain('margin-left: -16px;')
    expect(shellContent).not.toContain('margin-right: -16px;')
    expect(shellContent).not.toContain(':deep(.a-text-explanation)')
    expect(shellContent).not.toContain('var(--a-color-text-muted-dark)')
    expect(content).not.toContain('class="mt-4"')
    expect(content).not.toContain('class="a-text-explanation-enlarged mt-6"')
    expect(content).not.toContain("['a-text-explanation-enlarged', classes.description]")
    expect(content).not.toContain("['a-text-explanation-enlarged', classes.info]")
    expect(textContent).toContain('@mixin a-content-explanatory-copy()')
  })

  it('uses tokenized typography and spacing in node cells and status widgets', () => {
    const nodesTableContent = readFileSync(nodesTablePath, 'utf8')
    const columnContent = readFileSync(nodeColumnPath, 'utf8')
    const statusContent = readFileSync(nodeStatusPath, 'utf8')
    const checkboxContent = readFileSync(nodeStatusCheckboxPath, 'utf8')
    const metricsContent = readFileSync(nodeStatusUiMetricsPath, 'utf8')
    const labelContent = readFileSync(nodeLabelPath, 'utf8')
    const dataTableContent = readFileSync(settingsDataTablePath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const layoutPrimitives = readFileSync(layoutPrimitivesPath, 'utf8')

    expect(dataTableContent).toContain('--a-settings-data-table-line-height')
    expect(dataTableContent).toContain('var(--a-font-size-sm)')
    expect(dataTableContent).not.toContain('line-height: 14px;')

    expect(columnContent).toContain('--a-node-column-font-size')
    expect(columnContent).toContain('--a-node-column-padding-inline-end')
    expect(tokensContent).toContain('--a-node-column-checkbox-width')
    expect(tokensContent).toContain('--a-node-column-checkbox-width-mobile')
    expect(columnContent).toContain('var(--a-font-size-sm)')
    expect(columnContent).toContain('var(--a-space-2)')
    expect(columnContent).toContain('var(--a-node-column-checkbox-width)')
    expect(columnContent).toContain('var(--a-node-column-checkbox-width-mobile)')
    expect(columnContent).not.toContain('padding-left: 0 !important;')
    expect(columnContent).not.toContain('padding-right: 0 !important;')
    expect(columnContent).not.toContain('font-size: 14px;')
    expect(columnContent).not.toContain('padding-right: 8px !important;')
    expect(columnContent).not.toContain('--a-node-column-checkbox-width: 64px;')
    expect(columnContent).not.toContain('--a-node-column-checkbox-width-mobile: 56px;')

    expect(statusContent).toContain('--a-node-status-detail-font-size')
    expect(statusContent).toContain('--a-node-status-detail-font-weight')
    expect(statusContent).toContain('--a-node-status-text-color-dark')
    expect(statusContent).toContain('--a-node-status-title-line-height')
    expect(statusContent).toContain('--a-node-status-spinner-animation-duration')
    expect(statusContent).toContain('detailHelpButton')
    expect(statusContent).toContain(':size="NODE_STATUS_SPINNER_SIZE"')
    expect(statusContent).toContain(':width="NODE_STATUS_SPINNER_WIDTH"')
    expect(statusContent).toContain(':size="NODE_STATUS_DETAIL_ICON_SIZE"')
    expect(statusContent).toContain('detailHelpIcon')
    expect(statusContent).toContain('root: className')
    expect(statusContent).toContain('var(--a-font-size-xs)')
    expect(statusContent).toContain('var(--a-font-weight-light)')
    expect(statusContent).toContain('var(--a-color-text-muted-dark)')
    expect(layoutPrimitives).toContain('@mixin a-flex-align-center()')
    expect(statusContent).toContain("@use '@/assets/styles/components/_layout-primitives.scss'")
    expect(statusContent).toContain('@include layoutPrimitives.a-flex-align-center();')
    expect(statusContent).not.toContain('size="12"')
    expect(statusContent).not.toContain('width="2"')
    expect(statusContent).not.toContain('class="ml-1 cursor-pointer mb-0"')
    expect(statusContent).not.toContain('line-height: 1;')
    expect(statusContent).not.toContain('font-size: 12px;')
    expect(statusContent).not.toContain('font-weight: 300;')
    expect(statusContent).not.toContain('opacity: 0.7;')
    expect(statusContent).not.toContain(
      'animation-duration: var(--a-node-status-spinner-animation-duration) !important;'
    )

    expect(metricsContent).toContain('NODE_STATUS_SPINNER_SIZE = 12')
    expect(metricsContent).toContain('NODE_STATUS_SPINNER_WIDTH = 2')
    expect(metricsContent).toContain('NODE_STATUS_DETAIL_ICON_SIZE = 12')

    expect(labelContent).toContain('var(--a-node-label-height)')
    expect(labelContent).toContain('var(--a-node-label-padding-inline)')
    expect(labelContent).not.toContain('--v-chip-height: 18px;')
    expect(labelContent).not.toContain('padding: 0 4px;')

    expect(checkboxContent).toContain('--a-node-toggle-checkbox-font-size')
    expect(checkboxContent).toContain('--a-node-toggle-checkbox-offset-inline-start')
    expect(checkboxContent).toContain('var(--a-font-size-md)')
    expect(checkboxContent).toContain('var(--a-space-4)')
    expect(checkboxContent).toContain('var(--a-space-2)')
    expect(checkboxContent).not.toContain('font-size: 16px;')
    expect(checkboxContent).not.toContain('margin-left: 16px;')
    expect(checkboxContent).not.toContain('margin-left: 8px;')
    expect(checkboxContent).not.toContain("color: map.get(colors.$adm-colors, 'grey') !important;")
    expect(nodesTableContent).toContain(':deep(.v-selection-control__input .v-icon)')
  })

  it('uses tokenized head cells and removes utility padding classes from template', () => {
    const content = readFileSync(nodesTableHeadPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')

    expect(content).toContain('--a-nodes-table-head-font-size')
    expect(content).toContain('--a-nodes-table-head-padding-inline-end')
    expect(tokensContent).toContain('--a-nodes-table-head-label-width')
    expect(content).toContain('var(--a-font-size-xs)')
    expect(content).toContain('var(--a-space-2)')
    expect(content).toContain('width: var(--a-nodes-table-head-label-width);')
    expect(content).not.toContain('padding-left: 0 !important;')
    expect(content).not.toContain('padding-right: 0 !important;')
    expect(content).not.toContain('class="pl-0 pr-2"')
    expect(content).not.toContain('font-size: 12px;')
    expect(content).not.toContain('--a-nodes-table-head-label-width: 104px;')
  })

  it('uses muted dark text token for node meta rows and avoids hardcoded opacity', () => {
    const urlContent = readFileSync(nodeUrlPath, 'utf8')
    const versionContent = readFileSync(nodeVersionPath, 'utf8')
    const admRowContent = readFileSync(admNodesTableItemPath, 'utf8')
    const ipfsRowContent = readFileSync(ipfsNodesTableItemPath, 'utf8')

    expect(urlContent).toContain('--a-node-url-meta-font-size')
    expect(urlContent).toContain('root: className')
    expect(urlContent).toContain('var(--a-font-size-xs)')
    expect(urlContent).not.toContain('font-size: 12px;')

    expect(versionContent).toContain('--a-node-version-color-dark')
    expect(versionContent).toContain('var(--a-color-text-muted-dark)')
    expect(versionContent).not.toContain('opacity: 0.7;')

    expect(admRowContent).toContain('line-height: var(--a-font-size-sm);')
    expect(admRowContent).toContain('max-width: var(--a-node-compact-status-column-max-width);')
    expect(ipfsRowContent).toContain('line-height: var(--a-font-size-sm);')
    expect(admRowContent).not.toContain('line-height: 14px;')
    expect(admRowContent).not.toContain('max-width: 84px;')
    expect(ipfsRowContent).not.toContain('line-height: 14px;')
  })
})
