import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const appToolbarPath = path.resolve(currentDir, '../../components/AppToolbarCentered.vue')
const appNavigationPath = path.resolve(currentDir, '../../components/AppNavigation.vue')
const backButtonPath = path.resolve(currentDir, '../../components/common/BackButton/BackButton.vue')
const appSidebarPath = path.resolve(currentDir, '../AppSidebar.vue')
const filterRouteParamsPath = path.resolve(currentDir, '../../router/filterRouteParams.ts')
const commonUiMetricsPath = path.resolve(currentDir, '../../components/common/helpers/uiMetrics.ts')
const languageSwitcherPath = path.resolve(currentDir, '../../components/LanguageSwitcher.vue')
const currencySwitcherPath = path.resolve(currentDir, '../../components/CurrencySwitcher.vue')
const switcherMenuMixinPath = path.resolve(
  currentDir,
  '../../assets/styles/components/_switcher-menu.scss'
)
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')

describe('Navigation UI style contract', () => {
  it('uses shared title letter-spacing token in app toolbar', () => {
    const content = readFileSync(appToolbarPath, 'utf8')
    const metricsContent = readFileSync(commonUiMetricsPath, 'utf8')

    expect(content).toContain('--a-app-toolbar-title-letter-spacing')
    expect(content).toContain('var(--a-letter-spacing-caps-subtle)')
    expect(content).toContain('COMMON_INLINE_SPINNER_SIZE')
    expect(content).toContain('&__title-text')
    expect(content).toContain('&__subtitle')
    expect(content).toContain('@include mixins.a-text-regular-enlarged();')
    expect(content).toContain('@include mixins.a-text-regular();')
    expect(metricsContent).toContain('COMMON_INLINE_SPINNER_SIZE = 24')
    expect(content).not.toContain('letter-spacing: 0.02em;')
    expect(content).not.toContain('class="a-text-regular-enlarged"')
    expect(content).not.toContain('class="body-1"')
    expect(content).not.toContain(':size="24"')
  })

  it('uses tokenized size, spacing and hover states for back button', () => {
    const content = readFileSync(backButtonPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')

    expect(tokensContent).toContain('--a-back-button-size')
    expect(tokensContent).toContain('--a-back-button-margin-inline')
    expect(tokensContent).toContain('--a-back-button-hover-overlay-opacity')
    expect(tokensContent).toContain('--a-back-button-hover-transition-duration')
    expect(tokensContent).toContain('--a-auth-control-hit-size')
    expect(content).toContain('var(--a-back-button-size)')
    expect(content).toContain('var(--a-back-button-margin-inline)')
    expect(content).toContain('var(--a-back-button-hover-overlay-opacity)')
    expect(content).toContain('var(--a-back-button-hover-transition-duration)')
    expect(content).toContain('var(--a-radius-round)')
    expect(content).toContain('&.v-btn:first-child')

    expect(content).not.toContain('margin: 0 12px !important;')
    expect(content).not.toMatch(/(^|\n)\s*opacity:\s*0\.2;/)
    expect(content).not.toMatch(/(^|\n)\s*transition:\s*all 0\.4s ease;/)
  })

  it('uses shared tokens for bottom navigation sizing and badge metrics', () => {
    const content = readFileSync(appNavigationPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')

    expect(tokensContent).toContain('--a-app-navigation-height')
    expect(tokensContent).toContain('--a-app-navigation-button-font-weight')
    expect(tokensContent).toContain('--a-app-navigation-label-font-size')
    expect(tokensContent).toContain('--a-app-navigation-label-font-size-inactive')
    expect(tokensContent).toContain('--a-app-navigation-badge-size')
    expect(tokensContent).toContain('--a-app-navigation-badge-font-size')
    expect(tokensContent).toContain('--a-border-width-thin')
    expect(content).toContain('height: var(--a-app-navigation-height) !important;')
    expect(content).toContain('min-height: var(--a-app-navigation-height) !important;')
    expect(content).toContain('font-weight: var(--a-app-navigation-button-font-weight);')
    expect(content).toContain('font-size: var(--a-app-navigation-label-font-size);')
    expect(content).toContain('font-size: var(--a-app-navigation-label-font-size-inactive);')
    expect(content).toContain('font-size: var(--a-app-navigation-badge-font-size);')
    expect(content).toContain('width: var(--a-app-navigation-badge-size);')
    expect(content).toContain('height: var(--a-app-navigation-badge-size);')
    expect(content).toContain(':deep(.v-btn.v-btn:not(.v-btn--active))')
    expect(content).toContain('var(--a-color-text-inverse)')
    expect(content).toContain('var(--a-color-text-muted-dark)')
    expect(content).not.toContain('height="50"')
    expect(content).not.toContain('font-weight: 300;')
    expect(content).not.toContain('font-size: 14px;')
    expect(content).not.toContain('width: 22px;')
    expect(content).not.toContain('height: 22px;')
    expect(content).not.toContain('calc(0px +  env(safe-area-inset-bottom))')
    expect(content).not.toContain("color: map.get(colors.$adm-colors, 'muted') !important;")
    expect(content).not.toContain("color: map.get(colors.$adm-colors, 'grey-transparent');")
  })

  it('lets active overlays consume Escape before sidebar navigation', () => {
    const content = readFileSync(appSidebarPath, 'utf8')

    expect(content).toContain('const hasActiveOverlay = () => {')
    expect(content).toContain('const hasExpandedPopupActivator = () => {')
    expect(content).toContain('const hasFocusedEditableElement = () => {')
    expect(content).toContain('activeElement instanceof HTMLTextAreaElement')
    expect(content).toContain('activeElement instanceof HTMLInputElement')
    expect(content).toContain('activeElement.isContentEditable')
    expect(content).toContain("document.querySelectorAll('.v-overlay.v-overlay--active')")
    expect(content).toContain('document.querySelectorAll(\'[aria-expanded="true"]\')')
    expect(content).toContain("style.display !== 'none' && style.visibility !== 'hidden'")
    expect(content).toContain("element.getAttribute('role') === 'combobox'")
    expect(content).toContain("document.addEventListener('keydown', onKeydownHandler, true)")
    expect(content).toContain("document.removeEventListener('keydown', onKeydownHandler, true)")
    expect(content).toContain(
      'hasFocusedEditableElement() ||\n    hasActiveOverlay() ||\n    hasExpandedPopupActivator()'
    )
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

  it('uses a shared switcher menu pattern for language and currency switchers', () => {
    const languageContent = readFileSync(languageSwitcherPath, 'utf8')
    const currencyContent = readFileSync(currencySwitcherPath, 'utf8')
    const mixinContent = readFileSync(switcherMenuMixinPath, 'utf8')
    const tokensContent = readFileSync(genericTokensPath, 'utf8')

    expect(tokensContent).toContain('--a-switcher-menu-item-padding-inline')
    expect(tokensContent).toContain('--a-switcher-menu-list-padding-block')
    expect(tokensContent).toContain('--a-switcher-menu-row-min-height')
    expect(tokensContent).toContain('--a-switcher-menu-row-padding-block')
    expect(tokensContent).toContain('--a-switcher-menu-title-font-size')
    expect(tokensContent).toContain('--a-switcher-menu-title-line-height')
    expect(mixinContent).toContain('@mixin a-switcher-menu()')
    expect(mixinContent).toContain('var(--a-switcher-menu-list-padding-block)')
    expect(mixinContent).toContain('var(--a-switcher-menu-item-padding-inline)')
    expect(mixinContent).toContain('var(--a-switcher-menu-row-min-height)')
    expect(mixinContent).toContain('var(--a-switcher-menu-row-padding-block)')
    expect(mixinContent).toContain('var(--a-switcher-menu-title-font-size)')
    expect(mixinContent).toContain('var(--a-switcher-menu-title-line-height)')
    expect(mixinContent).toContain('font-weight: var(--a-font-weight-light);')

    for (const content of [languageContent, currencyContent]) {
      expect(content).toContain('switcherMenu.a-switcher-menu()')
      expect(content).toContain('__button')
      expect(content).toContain('__list')
      expect(content).toContain('__item')
      expect(content).toContain('__item-title')
      expect(content).not.toContain('class="ma-0 a-switcher-button"')
    }
  })
})
