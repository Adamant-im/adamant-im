// copied and modified from https://github.com/gergof/electron-builder-sandbox-fix/blob/master/lib/index.js

import fs from 'fs/promises'
import path from 'path'

const log = (message) => {
  // This hook runs in Node build-time context where app logger dependencies
  // (Pinia/localStorage/browser runtime) are unavailable.
  console.info(`[sandboxFix]   • ${message}`)
}

const afterPackHook = async (params) => {
  if (params.electronPlatformName !== 'linux') {
    // this fix is only required on linux
    return
  }

  const executable = path.join(params.appOutDir, params.packager.executableName)

  const loaderScript = `#!/usr/bin/env bash
set -u
SCRIPT_DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
exec "$SCRIPT_DIR/${params.packager.executableName}.bin" "--no-sandbox" "$@"
`
  try {
    await fs.rename(executable, executable + '.bin')
    await fs.writeFile(executable, loaderScript)
    await fs.chmod(executable, 0o755)
  } catch (error) {
    log('failed to create loader for sandbox fix: ' + error.message)
    throw new Error('Failed to create loader for sandbox fix', { cause: error })
  }

  log('sandbox fix successfully applied')
}

export default afterPackHook
