// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readLiveEnv } from '../../tests/shared/liveEnv'
import { DEPLOYMENT_TARGETS, checkDeployment } from './cspDeploymentCheck'

/**
 * Read-only CSP check of the public deployment matrix from issue #927. It only fetches public
 * pages and scripts, so it sends nothing and costs nothing, but it depends on third-party hosts
 * and is therefore opt-in: run it with `ADM_LIVE_DEPLOYMENTS=1`. The checks themselves are covered
 * without a network in `cspDeploymentCheck.spec.ts`; `tests/e2e/production-csp.live.spec.ts` runs
 * the same targets in a browser.
 *
 * Onion targets are not reachable without Tor. Check them from a Tor-enabled host with
 * `curl --socks5-hostname 127.0.0.1:9050 -D - http://<onion>/`.
 */
const liveDescribe = readLiveEnv('ADM_LIVE_DEPLOYMENTS') === '1' ? describe : describe.skip

liveDescribe('Deployed CSP matrix', () => {
  it.each(DEPLOYMENT_TARGETS)(
    '$url enforces the strict policy and the shared headers',
    async (target) => {
      expect(await checkDeployment(target)).toEqual([])
    },
    120_000
  )
})
