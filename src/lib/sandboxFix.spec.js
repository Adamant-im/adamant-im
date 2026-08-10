// @vitest-environment node

import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import sandboxFix from '../../scripts/electron/sandboxFix.mjs'

const temporaryDirectories = []

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

describe('Electron Linux sandbox fix', () => {
  it('renames the packaged executable and installs an executable loader', async () => {
    const appOutDir = await mkdtemp(path.join(os.tmpdir(), 'adamant-sandbox-fix-'))
    temporaryDirectories.push(appOutDir)
    const executableName = 'adamant-im'
    const executable = path.join(appOutDir, executableName)
    await writeFile(executable, 'binary')
    vi.spyOn(console, 'info').mockImplementation(() => {})

    await sandboxFix({
      appOutDir,
      electronPlatformName: 'linux',
      packager: { executableName }
    })

    expect(await readFile(`${executable}.bin`, 'utf8')).toBe('binary')
    expect(await readFile(executable, 'utf8')).toContain(
      'exec "$SCRIPT_DIR/adamant-im.bin" "--no-sandbox" "$@"'
    )
    expect((await stat(executable)).mode & 0o777).toBe(0o755)
  })
})
