import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { BigNumber } from '@/lib/bignumber'
import { FileOpener } from '@capacitor-community/file-opener'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

type BigNumberWithBufferHelpers = typeof BigNumber & {
  fromBuffer: (
    buf: Buffer,
    opts?: { size?: number; endian?: 'big' | 'little' | 1 | -1 }
  ) => BigNumber & {
    toBuffer: (opts?: { size?: number; endian?: 'big' | 'little' | 1 | -1 }) => Buffer
  }
}

describe('major dependency batch 2 usage', () => {
  it('bignumber.js custom buffer helpers keep round-trip conversion stable', () => {
    const extendedBigNumber = BigNumber as BigNumberWithBufferHelpers
    const source = Buffer.from([0x12, 0x34, 0xab, 0xcd])
    const parsed = extendedBigNumber.fromBuffer(source, { size: 1, endian: 'big' })
    const restored = parsed.toBuffer({ size: 1, endian: 'big' })

    expect(parsed.toString(16)).toBe('1234abcd')
    expect(Buffer.compare(restored, source)).toBe(0)
  })

  it('@capacitor-community/file-opener keeps open() API used by image modal', () => {
    const modalSource = readFileSync(
      path.resolve(process.cwd(), 'src/components/AChat/AChatAttachment/AChatImageModal.vue'),
      'utf8'
    )

    expect(typeof FileOpener.open).toBe('function')
    expect(modalSource).toContain('FileOpener.open({ filePath: fileResult.uri })')
  })

  it('electron-devtools-installer keeps default installer function and Vue DevTools id', () => {
    const mainProcessSource = readFileSync(
      path.resolve(process.cwd(), 'src/electron/main.js'),
      'utf8'
    )

    expect(typeof installExtension).toBe('function')
    expect(typeof VUEJS_DEVTOOLS).toBe('object')
    expect(typeof VUEJS_DEVTOOLS.id).toBe('string')
    expect(VUEJS_DEVTOOLS.id.length).toBeGreaterThan(0)
    expect(mainProcessSource).toContain('installExtension(VUEJS_DEVTOOLS')
  })
})
