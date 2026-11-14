import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const mainBundlePath = path.join(projectRoot, 'dist-electron', 'main.js')
// The path is derived exclusively from this script's own location.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const mainBundle = await readFile(mainBundlePath, 'utf8')
const forbiddenDevDependencies = ['electron-devtools-installer']

for (const dependency of forbiddenDevDependencies) {
  if (mainBundle.includes(dependency)) {
    throw new Error(`Production Electron main bundle references dev-only package: ${dependency}`)
  }
}
