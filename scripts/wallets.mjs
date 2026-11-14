import { $ } from 'execa'
import { relative } from 'path'

import {
  buildWalletArtifacts,
  findWalletArtifactDrift,
  getWalletArtifactPaths,
  writeWalletArtifacts
} from './wallets/artifacts.mjs'
import { resolveWalletsSourceBranch } from './wallets/sourceBranch.mjs'
import { WALLETS_SUBMODULE_PATH, assertPinnedWalletsCheckout } from './wallets/submodule.mjs'

const REGENERATE_FROM_PINNED_COMMAND = 'npm run wallets:data:generate -- --pinned'

// This script runs in plain Node.js context, so app logger aliases/stores are not available here.
const logInfo = (...args) => console.info('[wallets]', ...args)
const logError = (...args) => console.error('[wallets]', ...args)

run(process.argv.slice(2)).catch((error) => {
  logError(error)
  process.exitCode = 1
})

/**
 * Supported invocations:
 *
 * - no argument, `dev`, or `master` syncs `adamant-wallets` to a branch and regenerates artifacts
 * - `--pinned` regenerates artifacts from the pinned submodule revision without fetching
 * - `--check` compares committed artifacts with the pinned revision without writing anything
 *
 * @param {string[]} args Command line arguments
 * @returns {Promise<void>}
 */
async function run(args) {
  const { mode, requestedBranch } = parseArguments(args)
  const paths = getWalletArtifactPaths()

  if (mode === 'check') {
    await checkArtifacts(paths)
    return
  }

  if (mode === 'pinned') {
    const revision = await assertPinnedWalletsCheckout()
    logInfo('Regenerating from the pinned `adamant-wallets` revision:', revision)
  } else {
    await syncWalletsBranch(requestedBranch)
  }

  const artifacts = await buildWalletArtifacts(paths)
  await writeWalletArtifacts(artifacts, paths)
  await $`git add ${artifacts.iconFiles.map((file) => file.path)}` // git track newly added icons

  logInfo('Coins updated successfully')
}

/**
 * @param {string[]} args
 * @returns {{ mode: 'sync' | 'pinned' | 'check', requestedBranch?: string }}
 */
function parseArguments(args) {
  if (args.length > 1) {
    throw new Error(`Expected at most one argument, received: ${args.join(' ')}`)
  }

  const [arg] = args

  if (arg === '--check') return { mode: 'check' }
  if (arg === '--pinned') return { mode: 'pinned' }

  if (arg?.startsWith('-')) {
    throw new Error(`Unsupported option ${arg}. Expected --check, --pinned, "dev", or "master".`)
  }

  return { mode: 'sync', requestedBranch: arg }
}

/**
 * @param {string | undefined} requestedBranch The explicit branch to sync from. E.g.: dev, master
 * @returns {Promise<void>}
 */
async function syncWalletsBranch(requestedBranch) {
  const { stdout } = await $`git branch --show-current`
  const pwaBranch = stdout.trim()
  const branch = resolveWalletsSourceBranch({ pwaBranch, requestedBranch })

  logInfo(
    'Selecting `adamant-wallets` source:',
    requestedBranch === undefined
      ? `automatic mapping: PWA branch ${pwaBranch || '(detached HEAD)'} -> adamant-wallets/${branch}`
      : `explicit override: adamant-wallets/${branch} (PWA branch ${pwaBranch || '(detached HEAD)'})`
  )

  // update adamant-wallets repo
  await $`git submodule update --init`
  await $`git -C ${WALLETS_SUBMODULE_PATH} fetch origin ${branch}`
  await $`git -C ${WALLETS_SUBMODULE_PATH} checkout --detach origin/${branch}`

  logInfo('Updating coins data from `adamant-wallets`. Using branch:', branch)
}

/**
 * Fails when committed generated files differ from the pinned `adamant-wallets` metadata.
 *
 * @param {import('./wallets/artifacts.mjs').WalletArtifactPaths} paths
 * @returns {Promise<void>}
 */
async function checkArtifacts(paths) {
  const revision = await assertPinnedWalletsCheckout()
  const artifacts = await buildWalletArtifacts(paths)
  const drift = await findWalletArtifactDrift(artifacts, paths)

  if (drift.length === 0) {
    logInfo('Generated wallet artifacts match the pinned `adamant-wallets` revision:', revision)
    return
  }

  const files = drift.map(({ path, reason }) => `  - ${relative(process.cwd(), path)}: ${reason}`)

  logError(
    `Generated wallet artifacts differ from the pinned \`adamant-wallets\` revision ${revision}:\n` +
      `${files.join('\n')}\n` +
      `Run \`${REGENERATE_FROM_PINNED_COMMAND}\` and commit the result.`
  )
  process.exitCode = 1
}
