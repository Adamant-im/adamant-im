import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const exportKeysPath = path.resolve(currentDir, '../ExportKeysForm.vue')

describe('Export keys UI style contract', () => {
  it('uses tokenized spacing and semantic form actions on export keys screen', () => {
    const content = readFileSync(exportKeysPath, 'utf8')

    expect(content).toContain('<v-form :class="className" @submit.prevent="revealKeys">')
    expect(content).toContain('a-text-explanation-enlarged')
    expect(content).toContain('type="submit"')
    expect(content).toContain('type="button"')
    expect(content).toContain('--a-export-keys-section-spacing')
    expect(content).toContain('--a-export-keys-key-field-gap')
    expect(content).toContain('--a-export-keys-copy-all-margin-bottom')
    expect(content).toContain('--a-export-keys-button-margin-top')
    expect(content).toContain('--a-export-keys-button-margin-bottom')
    expect(content).toContain('var(--a-space-6)')
    expect(content).toContain('var(--a-space-4)')
    expect(content).toContain('var(--a-space-3)')
    expect(content).toContain('__copy-all-row')
    expect(content).toContain('__field-action')
    expect(content).not.toContain('margin-top: 24px;')
    expect(content).not.toContain('margin-bottom: 24px;')
    expect(content).not.toContain('margin-top: 15px;')
    expect(content).not.toContain('margin-bottom: 12px;')
    expect(content).not.toContain('padding-right: 0;')
    expect(content).not.toContain('margin-right: 0;')
    expect(content).not.toContain('--a-export-keys-mobile-inline-end-compensation')
  })
})
