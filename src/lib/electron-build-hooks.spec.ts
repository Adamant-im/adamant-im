import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('electron build hooks', () => {
  it('ignores APPLE_NOTARIZE from dotenv files for notarize and staple hooks', async () => {
    const hooksDir = process.cwd()
    const tempDir = mkdtempSync(join(tmpdir(), 'adamant-electron-hook-'))

    try {
      writeFileSync(
        join(tempDir, 'electron-builder.env.local'),
        'APPLE_NOTARIZE=true\nAPPLE_KEYCHAIN_PROFILE=AC_PASSWORD\n',
        'utf8'
      )
      const notarizeHookPath = join(hooksDir, 'scripts/electron/notarize.cjs')
      const stapleHookPath = join(hooksDir, 'scripts/electron/staple.cjs')

      const script = `
        const path = require('node:path')
        process.chdir(${JSON.stringify(tempDir)})
        delete process.env.APPLE_NOTARIZE
        const notarizeHook = require(${JSON.stringify(notarizeHookPath)}).default
        const stapleHook = require(${JSON.stringify(stapleHookPath)}).default
        ;(async () => {
          await notarizeHook({
            electronPlatformName: 'darwin',
            appOutDir: process.cwd(),
            packager: { appInfo: { productFilename: 'ADAMANT Messenger' } }
          })
          const result = await stapleHook({
            outDir: process.cwd(),
            artifactPaths: [],
            configuration: { productName: 'ADAMANT Messenger' }
          })
          console.log('STAPLE_RESULT=' + JSON.stringify(result))
        })().catch((error) => {
          console.error(error)
          process.exit(1)
        })
      `

      const runResult = spawnSync(process.execPath, ['-e', script], {
        encoding: 'utf8',
        env: {
          ...process.env
        }
      })

      expect(runResult.status).toBe(0)
      expect(runResult.stdout).toContain(
        '[notarizing] APPLE_NOTARIZE=false | Skipping the notarization'
      )
      expect(runResult.stdout).toContain('[stapling] APPLE_NOTARIZE=false | Skipping stapling')
      expect(runResult.stdout).toContain('STAPLE_RESULT=[]')
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
