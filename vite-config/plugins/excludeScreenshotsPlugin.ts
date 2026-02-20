import fs from 'node:fs'
import path from 'node:path'
import { Plugin } from 'vite'

/**
 * Exclude screenshots from Electron bundle
 */
export function excludeScreenshotsPlugin(): Plugin {
  return {
    name: 'exclude-screenshots-plugin',
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir as string
      const screenshotsDir = path.resolve(outDir, 'screenshots')

      // This plugin runs in Node build-time context, where app logger dependencies
      // (Pinia/localStorage/browser runtime) are unavailable. Using console for logging instead.
      fs.rm(screenshotsDir, { recursive: true }, () =>
        console.info(`[excludeScreenshotsPlugin] Deleted screenshots from ${screenshotsDir}`)
      )
    }
  }
}
