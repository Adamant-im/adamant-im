import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const appToolbarPath = path.resolve(currentDir, '../../components/AppToolbarCentered.vue')
const backButtonPath = path.resolve(currentDir, '../../components/common/BackButton/BackButton.vue')

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
})
