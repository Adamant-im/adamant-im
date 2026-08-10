// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

describe('CSP runtime source contract', () => {
  it('does not restore the Object.groupBy core-js runtime polyfill', () => {
    expect(readSource('../main.ts')).not.toContain('core-js')
  })

  it('uses the published vuedraggable ESM source instead of its compiler-bearing UMD bundle', () => {
    const walletsSource = readSource('../views/Wallets.vue')

    expect(walletsSource).toContain("from 'vuedraggable/src/vuedraggable.js'")
    expect(walletsSource).not.toMatch(/from ['"]vuedraggable['"]/)
  })

  it('keeps lodash out of browser runtime modules', () => {
    const runtimeSources = [
      readSource('../components/AChat/AChat.vue'),
      readSource('../components/SendFundsForm.vue'),
      readSource('../lib/idb/state.js'),
      readSource('../lib/sockets.js'),
      readSource('../mixins/scrollPosition.js'),
      readSource('../store/plugins/indexedDb.js')
    ]

    expect(runtimeSources.join('\n')).not.toContain('lodash-es')
  })
})
