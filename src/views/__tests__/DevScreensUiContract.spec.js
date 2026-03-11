import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')
const devVibrationsPath = path.resolve(currentDir, '../devScreens/DevVibrations.vue')
const devAdamantWalletsPath = path.resolve(currentDir, '../devScreens/DevAdamantWallets.vue')
const iconFilePath = path.resolve(currentDir, '../../components/icons/common/IconFile.vue')

describe('Dev screens UI style contract', () => {
  it('stores shared dev-screen and utility icon tokens in the generic token layer', () => {
    const tokensContent = readFileSync(genericTokensPath, 'utf8')

    expect(tokensContent).toContain('--a-dev-screen-padding-inline')
    expect(tokensContent).toContain('--a-dev-screen-padding-inline-mobile')
    expect(tokensContent).toContain('--a-dev-screen-section-gap')
    expect(tokensContent).toContain('--a-dev-screen-section-title-gap')
    expect(tokensContent).toContain('--a-dev-screen-section-title-padding-bottom')
    expect(tokensContent).toContain('--a-dev-screen-code-font-size')
    expect(tokensContent).toContain('--a-dev-screen-code-font-size-md')
    expect(tokensContent).toContain('--a-dev-screen-code-font-size-sm')
    expect(tokensContent).toContain('--a-dev-screen-code-padding')
    expect(tokensContent).toContain('--a-dev-screen-code-padding-mobile')
    expect(tokensContent).toContain('--a-dev-screen-code-border-radius')
    expect(tokensContent).toContain('--a-dev-screen-card-title-padding-bottom')
    expect(tokensContent).toContain('--a-dev-screen-card-text-padding-top')
    expect(tokensContent).toContain('--a-dev-screen-card-text-max-height')
    expect(tokensContent).toContain('--a-dev-screen-code-max-height')
    expect(tokensContent).toContain('--a-icon-file-text-font-size')
  })

  it('uses shared tokens across the vibrations and wallet dev screens', () => {
    const vibrationsContent = readFileSync(devVibrationsPath, 'utf8')
    const walletsContent = readFileSync(devAdamantWalletsPath, 'utf8')

    expect(vibrationsContent).toContain('padding: var(--a-dev-screen-padding-inline);')
    expect(vibrationsContent).toContain('padding: var(--a-dev-screen-padding-inline-mobile);')
    expect(vibrationsContent).toContain('margin-bottom: var(--a-dev-screen-section-gap);')
    expect(vibrationsContent).toContain('margin-bottom: var(--a-dev-screen-section-title-gap);')
    expect(vibrationsContent).toContain(
      'padding-bottom: var(--a-dev-screen-section-title-padding-bottom);'
    )
    expect(vibrationsContent).not.toContain('padding: 24px;')
    expect(vibrationsContent).not.toContain('padding: 16px;')
    expect(vibrationsContent).not.toContain('margin-bottom: 32px;')
    expect(vibrationsContent).not.toContain('margin-bottom: 16px;')
    expect(vibrationsContent).not.toContain('padding-bottom: 8px;')

    expect(walletsContent).toContain('margin-bottom: var(--a-dev-screen-section-gap);')
    expect(walletsContent).toContain('margin-bottom: var(--a-dev-screen-section-title-gap);')
    expect(walletsContent).toContain(
      'padding-bottom: var(--a-dev-screen-section-title-padding-bottom);'
    )
    expect(walletsContent).toContain(
      'padding-bottom: var(--a-dev-screen-card-title-padding-bottom);'
    )
    expect(walletsContent).toContain('padding-top: var(--a-dev-screen-card-text-padding-top);')
    expect(walletsContent).toContain('max-height: var(--a-dev-screen-card-text-max-height);')
    expect(walletsContent).toContain('font-size: var(--a-dev-screen-code-font-size);')
    expect(walletsContent).toContain('font-size: var(--a-dev-screen-code-font-size-md);')
    expect(walletsContent).toContain('font-size: var(--a-dev-screen-code-font-size-sm);')
    expect(walletsContent).toContain('padding: var(--a-dev-screen-code-padding);')
    expect(walletsContent).toContain('padding: var(--a-dev-screen-code-padding-mobile);')
    expect(walletsContent).toContain('border-radius: var(--a-dev-screen-code-border-radius);')
    expect(walletsContent).toContain('max-height: var(--a-dev-screen-code-max-height);')
    expect(walletsContent).not.toContain('font-size: 12px;')
    expect(walletsContent).not.toContain('font-size: 11px;')
    expect(walletsContent).not.toContain('font-size: 10px;')
    expect(walletsContent).not.toContain('padding: 12px;')
    expect(walletsContent).not.toContain('padding: 8px;')
    expect(walletsContent).not.toContain('border-radius: 4px;')
    expect(walletsContent).not.toContain('max-height: 400px;')
    expect(walletsContent).not.toContain('max-height: 300px;')
  })

  it('uses shared tokenized typography in icon file glyphs', () => {
    const content = readFileSync(iconFilePath, 'utf8')

    expect(content).toContain('font-size: var(--a-icon-file-text-font-size);')
    expect(content).not.toContain('font-size: 112px;')
  })
})
