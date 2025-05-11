// copied and modified from https://github.com/gergof/electron-builder-sandbox-fix/blob/master/lib/index.js

import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'

const log = (message, dotFormatting = chalk.blue) => {
  console.log(`  ${dotFormatting('•')} ${message}`)
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
  } catch (e) {
    log('failed to create loader for sandbox fix: ' + e.message, chalk.red)
    throw new Error('Failed to create loader for sandbox fix')
  }

  log('sandbox fix successfully applied', chalk.green)
}

export default afterPackHook
