import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const optionsPath = path.resolve(currentDir, '../Options.vue')
const genericTokensPath = path.resolve(currentDir, '../../assets/styles/generic/_tokens.scss')

describe('Options UI style contract', () => {
  it('uses shared interactive opacity tokens', () => {
    const content = readFileSync(genericTokensPath, 'utf8')

    expect(content).toContain('--a-opacity-interactive-hover')
    expect(content).toContain('--a-opacity-interactive-pressed')
  })

  it('uses tokenized settings spacing and typography variables', () => {
    const content = readFileSync(optionsPath, 'utf8')

    expect(content).toContain('--a-settings-gutter')
    expect(content).toContain('--a-settings-title-padding-top')
    expect(content).toContain('--a-settings-actions-row-min-height')
    expect(content).toContain('--a-settings-actions-row-padding-block')
    expect(content).toContain('--a-settings-version-info-hover-opacity')
    expect(content).toContain('--a-settings-version-info-active-opacity')
    expect(content).toContain('var(--a-list-row-min-height)')
    expect(content).toContain('var(--a-list-row-padding-block)')
    expect(content).toContain('var(--a-opacity-interactive-hover)')
    expect(content).toContain('var(--a-opacity-interactive-pressed)')
    expect(content).toContain('var(--a-color-text-muted-dark)')
    expect(content).toContain('var(--a-space-6)')
    expect(content).toContain('var(--a-space-4)')
    expect(content).not.toMatch(/(^|\n)\s*padding-top:\s*15px;/)
    expect(content).toContain('min-height: var(--a-settings-actions-row-min-height);')
    expect(content).toContain('padding-top: var(--a-settings-actions-row-padding-block);')
    expect(content).toContain('padding-bottom: var(--a-settings-actions-row-padding-block);')
    expect(content).not.toContain('--a-settings-action-font-size')
    expect(content).not.toContain('--a-settings-action-font-weight')
    expect(content).not.toContain('--a-settings-action-margin-block')
    expect(content).not.toContain('&__action')
    expect(content).not.toContain('opacity: 0.8;')
    expect(content).not.toContain('opacity: 0.6;')
  })
})
