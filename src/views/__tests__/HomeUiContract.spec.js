import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const homePath = path.resolve(currentDir, '../Home.vue')

describe('Home UI style contract', () => {
  it('uses tokenized wallet tabs spacing and sizing variables', () => {
    const content = readFileSync(homePath, 'utf8')

    expect(content).toContain('--a-account-tabs-slider-height')
    expect(content).toContain('--a-account-tabs-padding-top')
    expect(content).toContain('--a-account-tabs-padding-bottom')
    expect(content).toContain('--a-account-tabs-margin-bottom')
    expect(content).toContain('--a-account-tab-font-size')
    expect(content).toContain('--a-account-tab-affix-width')
    expect(content).toContain('var(--a-font-size-md)')
    expect(content).toContain('var(--a-control-size-sm)')
    expect(content).toContain('var(--a-radius-round)')

    expect(content).not.toContain('font-size: 16px;')
    expect(content).not.toContain('flex-basis: 32px;')
    expect(content).not.toContain('min-width: 32px;')
  })
})
