// @vitest-environment node

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('BIP39 bundle contract', () => {
  it('imports only the English wordlist into application sources', () => {
    const sourceRoot = fileURLToPath(new URL('../', import.meta.url))
    const sourceFiles = readdirSync(sourceRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(?:js|ts|vue)$/.test(entry.name))
      .map((entry) => path.join(entry.parentPath, entry.name))
    const wordlistImports = sourceFiles.flatMap((file) => {
      const source = readFileSync(file, 'utf8')

      return [...source.matchAll(/@scure\/bip39\/wordlists\/([^'"\s]+)/g)].map(
        ([, wordlist]) => wordlist
      )
    })

    expect(new Set(wordlistImports)).toEqual(new Set(['english.js']))
  })
})
