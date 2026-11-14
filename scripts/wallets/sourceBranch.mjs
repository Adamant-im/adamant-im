const SUPPORTED_WALLETS_SOURCE_BRANCHES = new Set(['dev', 'master'])

/**
 * Selects one coherent adamant-wallets source for the generated artifacts.
 *
 * @param {object} options
 * @param {string} [options.pwaBranch] The currently checked out PWA branch
 * @param {string} [options.requestedBranch] An explicit adamant-wallets branch override
 * @returns {'dev' | 'master'}
 */
export function resolveWalletsSourceBranch({ pwaBranch, requestedBranch } = {}) {
  if (requestedBranch !== undefined) {
    if (!SUPPORTED_WALLETS_SOURCE_BRANCHES.has(requestedBranch)) {
      throw new Error(
        `Unsupported adamant-wallets source branch: ${requestedBranch || '(empty)'}. ` +
          'Expected "dev" or "master".'
      )
    }

    return requestedBranch
  }

  return pwaBranch === 'master' ? 'master' : 'dev'
}
