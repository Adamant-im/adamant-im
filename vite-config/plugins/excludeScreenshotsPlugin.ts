import fs from 'node:fs'
import path from 'path'

/**
 * Exclude screenshots from Electron bundle
 */
export function excludeScreenshotsPlugin () {
  return {
    name: 'exclude-screenshots-plugin',
    resolveId (source) {
      return source === 'virtual-module' ? source : null
    },
    writeBundle (outputOptions, inputOptions) {
      const outDir = outputOptions.dir;
      const screenshotsDir = path.resolve(outDir, 'screenshots');
      fs.rm(screenshotsDir, { recursive: true }, () => console.log(`Deleted ${screenshotsDir}`))
    }
  }
}
