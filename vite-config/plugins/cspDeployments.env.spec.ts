// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readLiveEnv } from '../../tests/shared/liveEnv'
import { findUnsafeRuntimeSources } from './cspHardeningPlugin'

/**
 * Read-only CSP check of the public deployment matrix from issue #927. It only fetches public
 * pages and scripts, so it sends nothing and costs nothing, but it depends on third-party hosts
 * and is therefore opt-in: run it with `ADM_LIVE_DEPLOYMENTS=1`.
 *
 * Onion targets are not reachable without Tor. Check them from a Tor-enabled host with
 * `curl --socks5-hostname 127.0.0.1:9050 -D - http://<onion>/`.
 */
const liveDescribe = readLiveEnv('ADM_LIVE_DEPLOYMENTS') === '1' ? describe : describe.skip

type Target = {
  url: string
  // Whether the host can send response headers. Static hosts rely on the meta policy alone.
  sendsHeaders: boolean
}

const TARGETS: Target[] = [
  // Mainnet
  { url: 'https://msg.adamant.im/', sendsHeaders: true },
  { url: 'https://adm.im/', sendsHeaders: true },
  { url: 'https://msgtest.adamant.im/', sendsHeaders: true },
  { url: 'https://msg2.adamant.im/', sendsHeaders: true },
  { url: 'https://dev.adamant.im/', sendsHeaders: true },
  { url: 'https://adamant-im.github.io/adamant-im/', sendsHeaders: false },
  // Massa DeWeb (`adm.massa`) through a public DeWeb provider
  { url: 'https://adm.deweb.half-red.net/', sendsHeaders: false },
  // Testnet
  { url: 'https://msg-adamant-testnet.surge.sh/', sendsHeaders: false },
  { url: 'http://msg-testnet.adamant.im/', sendsHeaders: false },
  { url: 'https://dev-adamant-testnet.surge.sh/', sendsHeaders: false },
  { url: 'http://dev-testnet.adamant.im/', sendsHeaders: false }
]

const HEADER_ONLY_DIRECTIVES = new Set(['frame-ancestors', 'report-uri', 'report-to'])
const REQUEST_TIMEOUT_MS = 30_000

const decodeHtmlAttribute = (value: string) =>
  value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

function parsePolicy(policy: string): Map<string, string> {
  return new Map(
    policy
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name.toLowerCase(), sources.join(' ')])
  )
}

const withoutHeaderOnlyDirectives = (policy: Map<string, string>) =>
  new Map([...policy].filter(([name]) => !HEADER_ONLY_DIRECTIVES.has(name)))

async function fetchText(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })

  expect(response.ok, `${url} returned HTTP ${response.status}`).toBe(true)
  return { response, text: await response.text() }
}

liveDescribe('Deployed CSP matrix', () => {
  it.each(TARGETS)(
    '$url enforces the strict policy',
    async ({ url, sendsHeaders }) => {
      const { response, text: html } = await fetchText(url)

      const metaContent = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i.exec(
        html
      )?.[1]
      expect(metaContent, `${url} has no CSP meta policy`).toBeDefined()

      const metaPolicy = parsePolicy(decodeHtmlAttribute(metaContent!))
      expect(metaPolicy.get('script-src')).toBe(`'self' 'wasm-unsafe-eval'`)

      const headerValue = response.headers.get('content-security-policy')
      if (sendsHeaders) {
        expect(headerValue, `${url} sends no CSP header`).toBeTruthy()
      }

      if (headerValue) {
        const headerPolicy = parsePolicy(headerValue)

        // Browsers enforce both policies, so any difference silently narrows the build's policy.
        expect(withoutHeaderOnlyDirectives(headerPolicy)).toEqual(metaPolicy)
        expect(headerPolicy.get('frame-ancestors')).toBe(`'none'`)
      }

      const scriptUrls = [
        ...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g),
        ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)
      ].map(([, src]) => new URL(src, url).href)
      expect(scriptUrls.length, `${url} references no module scripts`).toBeGreaterThan(0)

      for (const scriptUrl of scriptUrls) {
        const { text: code } = await fetchText(scriptUrl)

        expect(findUnsafeRuntimeSources(scriptUrl, code)).toEqual([])
      }
    },
    120_000
  )
})
