import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const appToolbarPath = path.resolve(currentDir, '../../components/AppToolbarCentered.vue')
const backButtonPath = path.resolve(currentDir, '../../components/common/BackButton/BackButton.vue')
const appSidebarPath = path.resolve(currentDir, '../AppSidebar.vue')
const filterRouteParamsPath = path.resolve(currentDir, '../../router/filterRouteParams.ts')

describe('Navigation UI style contract', () => {
  it('uses shared title letter-spacing token in app toolbar', () => {
    const content = readFileSync(appToolbarPath, 'utf8')

    expect(content).toContain('--a-app-toolbar-title-letter-spacing')
    expect(content).toContain('var(--a-letter-spacing-caps-subtle)')
    expect(content).not.toContain('letter-spacing: 0.02em;')
  })

  it('uses tokenized size, spacing and hover states for back button', () => {
    const content = readFileSync(backButtonPath, 'utf8')

    expect(content).toContain('--a-back-button-size')
    expect(content).toContain('--a-back-button-margin-inline')
    expect(content).toContain('--a-back-button-hover-overlay-opacity')
    expect(content).toContain('--a-back-button-hover-transition-duration')
    expect(content).toContain('var(--a-space-3)')
    expect(content).toContain('var(--a-radius-round)')

    expect(content).not.toContain('margin: 0 12px !important;')
    expect(content).not.toMatch(/(^|\n)\s*opacity:\s*0\.2;/)
    expect(content).not.toMatch(/(^|\n)\s*transition:\s*all 0\.4s ease;/)
  })

  it('lets active overlays consume Escape before sidebar navigation', () => {
    const content = readFileSync(appSidebarPath, 'utf8')

    expect(content).toContain('const hasActiveOverlay = () => {')
    expect(content).toContain('const hasExpandedPopupActivator = () => {')
    expect(content).toContain("document.querySelectorAll('.v-overlay.v-overlay--active')")
    expect(content).toContain('document.querySelectorAll(\'[aria-expanded="true"]\')')
    expect(content).toContain("style.display !== 'none' && style.visibility !== 'hidden'")
    expect(content).toContain("element.getAttribute('role') === 'combobox'")
    expect(content).toContain("document.addEventListener('keydown', onKeydownHandler, true)")
    expect(content).toContain("document.removeEventListener('keydown', onKeydownHandler, true)")
    expect(content).toContain('hasActiveOverlay() ||\n    hasExpandedPopupActivator()')
  })

  it('filters route params before navigating to a parent route', () => {
    const toolbarContent = readFileSync(appToolbarPath, 'utf8')
    const sidebarContent = readFileSync(appSidebarPath, 'utf8')
    const helperContent = readFileSync(filterRouteParamsPath, 'utf8')

    expect(toolbarContent).toContain(
      "import { filterRouteParams } from '@/router/filterRouteParams'"
    )
    expect(sidebarContent).toContain(
      "import { filterRouteParams } from '@/router/filterRouteParams'"
    )
    expect(toolbarContent).toContain(
      'const params = filterRouteParams(parentRoute.path, route.params)'
    )
    expect(sidebarContent).toContain(
      'const params = filterRouteParams(parentRoute.path, route.params)'
    )
    expect(toolbarContent).not.toContain('params: { ...route.params }')
    expect(sidebarContent).not.toContain('params: { ...route.params }')
    expect(helperContent).toContain('const ROUTE_PARAM_NAME_PATTERN = /:([A-Za-z0-9_]+)/g')
    expect(helperContent).toContain('targetPath.matchAll(ROUTE_PARAM_NAME_PATTERN)')
  })
})
