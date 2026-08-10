// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url))
const readSource = (file: string) => readFileSync(path.resolve(projectRoot, file), 'utf8')

describe('local secret exposure contract', () => {
  it('does not expose the Vue application or store on window', () => {
    expect(readSource('src/store/index.js')).not.toContain('window.store')
    expect(readSource('src/main.ts')).not.toContain('window.ep')
    expect(readSource('src/window.d.ts')).not.toMatch(/\b(?:ep|store)\s*:/)
  })

  it('does not execute renderer JavaScript from the Electron main process', () => {
    expect(readSource('src/electron/main.js')).not.toContain('executeJavaScript')
  })

  it('exposes only a non-sensitive platform flag from the Electron preload', () => {
    const preloadSource = readSource('src/electron/preload.ts')

    expect(preloadSource).toContain("contextBridge.exposeInMainWorld(\n  'adamantDesktop'")
    expect(preloadSource).toContain('isElectron: true as const')
    expect(preloadSource).not.toMatch(/passphrase|password|privateKey|store/i)
  })
})
