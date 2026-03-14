import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const buttonsThemePath = path.resolve(
  currentDir,
  '../../assets/styles/themes/adamant/_buttons.scss'
)
const inputsThemePath = path.resolve(currentDir, '../../assets/styles/themes/adamant/_inputs.scss')
const vuetifyGlobalsPath = path.resolve(currentDir, '../../assets/styles/generic/_vuetify.scss')

describe('Theme layer contract', () => {
  it('keeps link-action button styles tokenized without forceful overrides', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')
    const buttonsContent = readFileSync(buttonsThemePath, 'utf8')

    expect(tokensContent).toContain('--a-link-action-font-size')
    expect(tokensContent).toContain('--a-link-action-font-weight')
    expect(tokensContent).toContain('--a-link-action-overlay-opacity-light')
    expect(tokensContent).toContain('--a-link-action-overlay-opacity-dark')
    expect(buttonsContent).toContain('.a-btn-link')
    expect(buttonsContent).toContain('font-size: var(--a-link-action-font-size);')
    expect(buttonsContent).toContain('font-weight: var(--a-link-action-font-weight);')
    expect(buttonsContent).not.toContain('font-size: var(--a-link-action-font-size) !important;')
    expect(buttonsContent).not.toContain(
      "background-color: map.get(settings.$shades, 'white') !important;"
    )
    expect(buttonsContent).not.toContain("color: map.get(colors.$adm-colors, 'muted') !important;")
  })

  it('keeps input theme overrides semantic and avoids forceful label/rate overrides', () => {
    const inputsContent = readFileSync(inputsThemePath, 'utf8')

    expect(inputsContent).toContain('.a-label-secondary')
    expect(inputsContent).toContain('font-size: 10.5px;')
    expect(inputsContent).toContain('&--rate')
    expect(inputsContent).toContain('color: inherit;')
    expect(inputsContent).not.toContain('font-size: 10.5px !important;')
    expect(inputsContent).not.toContain('color: inherit !important;')
    expect(inputsContent).not.toContain("color: map.get(colors.$adm-colors, 'muted') !important;")
  })

  it('keeps global Vuetify disabled/button opacity overrides explicit without unset/important fallbacks', () => {
    const vuetifyContent = readFileSync(vuetifyGlobalsPath, 'utf8')

    expect(vuetifyContent).toContain(
      '.v-btn.v-btn--disabled:not(.v-btn--icon).v-btn--variant-elevated'
    )
    expect(vuetifyContent).toContain('box-shadow: none;')
    expect(vuetifyContent).toContain('opacity: 1;')
    expect(vuetifyContent).not.toContain('box-shadow: none !important;')
    expect(vuetifyContent).not.toContain('opacity: 0 !important;')
    expect(vuetifyContent).not.toContain('opacity: unset;')
  })
})
