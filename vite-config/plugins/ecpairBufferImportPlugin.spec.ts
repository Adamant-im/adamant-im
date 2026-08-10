// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { ecpairBufferImportPlugin } from './ecpairBufferImportPlugin'

describe('ecpair Buffer import plugin', () => {
  it('injects a lexical Buffer import only into ECPair ESM self-test code', () => {
    const plugin = ecpairBufferImportPlugin()
    const transform = plugin.transform as (code: string, id: string) => unknown
    const code = "const h = (hex) => Buffer.from(hex, 'hex')"

    expect(transform(code, '/repo/node_modules/ecpair/src/esm/testecc.js')).toEqual({
      code: `import { Buffer } from 'buffer'\n${code}`,
      map: null
    })
    expect(transform(code, '/repo/src/main.ts')).toBeNull()
  })
})
