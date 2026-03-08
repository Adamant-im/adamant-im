import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const tokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const vuetifyPath = path.resolve(currentDir, '../../assets/styles/generic/_vuetify.scss')
const appSnackbarPath = path.resolve(currentDir, '../../components/AppSnackbar.vue')
const progressIndicatorPath = path.resolve(currentDir, '../../components/ProgressIndicator.vue')

describe('Feedback UI style contract', () => {
  it('stores shared snackbar and progress indicator tokens in the generic tokens layer', () => {
    const content = readFileSync(tokensPath, 'utf8')

    expect(content).toContain('--a-snackbar-max-width')
    expect(content).toContain('--a-snackbar-content-font-size')
    expect(content).toContain('--a-snackbar-content-line-height')
    expect(content).toContain('--a-snackbar-content-gap')
    expect(content).toContain('--a-snackbar-multiline-min-height')
    expect(content).toContain('--a-snackbar-close-button-size')
    expect(content).toContain('--a-progress-indicator-spinner-size')
    expect(content).toContain('--a-progress-indicator-spinner-stroke')
    expect(content).toContain('--a-progress-indicator-z-index')
    expect(content).toContain('--a-progress-indicator-backdrop')
  })

  it('uses the shared snackbar tokens in both Vuetify globals and AppSnackbar component styles', () => {
    const vuetifyContent = readFileSync(vuetifyPath, 'utf8')
    const snackbarContent = readFileSync(appSnackbarPath, 'utf8')

    expect(vuetifyContent).toContain('.v-snackbar__content {')
    expect(vuetifyContent).toContain('font-size: var(--a-snackbar-content-font-size);')
    expect(vuetifyContent).toContain('line-height: var(--a-snackbar-content-line-height);')
    expect(vuetifyContent).toContain('max-width: var(--a-snackbar-max-width);')
    expect(vuetifyContent).not.toContain('.v-snack__content')
    expect(vuetifyContent).not.toContain('max-width: 400px;')

    expect(snackbarContent).toContain('`${className}__message`')
    expect(snackbarContent).toContain('`${className}__close-button`')
    expect(snackbarContent).toContain('var(--a-snackbar-max-width)')
    expect(snackbarContent).toContain('var(--a-snackbar-content-font-size)')
    expect(snackbarContent).toContain('var(--a-snackbar-content-line-height)')
    expect(snackbarContent).toContain('var(--a-snackbar-content-gap)')
    expect(snackbarContent).toContain('var(--a-snackbar-multiline-min-height)')
    expect(snackbarContent).toContain('var(--a-snackbar-close-button-size)')
    expect(snackbarContent).not.toContain('max-width: 300px;')
    expect(snackbarContent).not.toContain('font-size: 16px;')
    expect(snackbarContent).not.toContain('gap: 8px;')
    expect(snackbarContent).not.toContain('min-height: 64px;')
    expect(snackbarContent).not.toContain('width: 36px;')
  })

  it('keeps progress indicator centered through layout styles instead of negative-margin offsets', () => {
    const content = readFileSync(progressIndicatorPath, 'utf8')

    expect(content).toContain('PROGRESS_INDICATOR_SPINNER_SIZE')
    expect(content).toContain('PROGRESS_INDICATOR_SPINNER_STROKE')
    expect(content).toContain('progress-indicator progress-fog')
    expect(content).toContain('progress-indicator__spinner progress-circular')
    expect(content).toContain('display: grid;')
    expect(content).toContain('place-items: center;')
    expect(content).toContain('var(--a-progress-indicator-backdrop)')
    expect(content).toContain('var(--a-progress-indicator-z-index)')
    expect(content).not.toContain('margin: 0px -75px;')
    expect(content).not.toContain('padding-top: 15%;')
    expect(content).not.toContain('color="#4A4A4A"')
  })
})
