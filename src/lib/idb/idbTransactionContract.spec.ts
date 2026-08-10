// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const storeFiles = ['./stores/Modules.js', './stores/Chats.js', './stores/Security.js']

describe('IndexedDB transaction completion contract', () => {
  it.each(storeFiles)('%s awaits the idb transaction completion promise', async (storeFile) => {
    const source = await readFile(fileURLToPath(new URL(storeFile, import.meta.url)), 'utf8')

    expect(source).not.toContain('tx.complete')
    expect(source.match(/return tx\.done/g)).toHaveLength(3)
  })
})
