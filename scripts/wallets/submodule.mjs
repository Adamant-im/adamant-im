import { $ } from 'execa'

export const WALLETS_SUBMODULE_PATH = 'adamant-wallets'

// Verification must not refresh the index or take optional git locks.
const $readOnly = $({ env: { GIT_OPTIONAL_LOCKS: '0' } })

const SUBMODULE_STATES = {
  ' ': 'current',
  '-': 'uninitialized',
  '+': 'different',
  U: 'conflict'
}

/**
 * Parses `git ls-files --stage -- <path>` output for a submodule.
 *
 * @param {string} output
 * @param {string} [path]
 * @returns {string} The submodule revision pinned in the git index
 */
export function parsePinnedRevision(output, path = WALLETS_SUBMODULE_PATH) {
  const entry = output
    .split('\n')
    .map((line) => /^160000 ([0-9a-f]{40,64}) 0\t(.+)$/.exec(line))
    .find((match) => match?.[2] === path)

  if (!entry) {
    throw new Error(`${path} has no resolved submodule revision in the git index`)
  }

  return entry[1]
}

/**
 * Parses `git submodule status -- <path>` output for one submodule.
 *
 * @param {string} output
 * @returns {{ state: 'current' | 'uninitialized' | 'different' | 'conflict', revision: string }}
 */
export function parseSubmoduleStatus(output) {
  const match = /^([ +\-U])([0-9a-f]{40,64}) /.exec(output)

  if (!match) {
    throw new Error(`Unexpected git submodule status output: ${JSON.stringify(output)}`)
  }

  return { state: SUBMODULE_STATES[match[1]], revision: match[2] }
}

/**
 * Verifies, without changing any git state, that `adamant-wallets` is checked out at the pinned
 * revision and that its metadata has no local changes.
 *
 * @returns {Promise<string>} The pinned revision
 */
export async function assertPinnedWalletsCheckout() {
  const path = WALLETS_SUBMODULE_PATH
  const { stdout: indexEntry } = await $readOnly`git ls-files --stage -- ${path}`
  const pinnedRevision = parsePinnedRevision(indexEntry, path)

  const { stdout: status } = await $readOnly`git submodule status -- ${path}`
  const { state, revision } = parseSubmoduleStatus(status)

  if (state === 'uninitialized') {
    throw new Error(
      `${path} is not initialized. Run \`git submodule update --init ${path}\` ` +
        `to check out the pinned revision ${pinnedRevision}`
    )
  }

  if (state === 'conflict') {
    throw new Error(`${path} has an unresolved merge conflict`)
  }

  if (state === 'different') {
    throw new Error(
      `${path} is checked out at ${revision}, but this repository pins ${pinnedRevision}. ` +
        `Run \`git submodule update ${path}\` to restore the pinned revision, or regenerate ` +
        `and stage the checked out revision with \`git add ${path}\``
    )
  }

  const { stdout: changes } =
    await $readOnly`git -C ${path} status --porcelain --untracked-files=all -- assets`

  if (changes.trim()) {
    throw new Error(
      `${path}/assets has local changes and does not match the pinned revision ${pinnedRevision}:\n${changes}`
    )
  }

  return pinnedRevision
}
