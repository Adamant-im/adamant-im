import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (file: string) => readFileSync(path.resolve(process.cwd(), file), 'utf8')

describe('local secret exposure contract', () => {
  it('does not expose the Vue application or store on window', () => {
    expect(readSource('src/store/index.js')).not.toContain('window.store')
    expect(readSource('src/main.ts')).not.toContain('window.ep')
  })

  it('does not execute renderer JavaScript from the Electron main process', () => {
    expect(readSource('src/electron/main.js')).not.toContain('executeJavaScript')
  })
})
