// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { CSP_REPORT_PATH, checkDeployment, type FetchLike } from './cspDeploymentCheck'
import {
  PWA_CONTENT_SECURITY_POLICY,
  PWA_HEADER_CONTENT_SECURITY_POLICY,
  PWA_SECURITY_HEADERS
} from './cspHardeningPlugin'

const PAGE_URL = 'https://msg.example/'
const ENTRY_URL = 'https://msg.example/assets/index-abc.js'
const PRELOAD_URL = 'https://msg.example/assets/vendor-def.js'

type Fixture = { status?: number; headers?: Record<string, string>; body: string }

const pageHtml = (policy = PWA_CONTENT_SECURITY_POLICY) =>
  `<!doctype html><html><head>` +
  `<meta http-equiv="Content-Security-Policy" content="${policy.replace(/'/g, '&#39;')}">` +
  `<script type="module" crossorigin src="/assets/index-abc.js"></script>` +
  `<link rel="modulepreload" crossorigin href="/assets/vendor-def.js">` +
  `</head><body><div id="app"></div></body></html>`

// Response headers of a header-capable host; `null` removes a header.
function pageHeaders(overrides: Record<string, string | null> = {}) {
  const headers: Record<string, string | null> = {
    'Content-Type': 'text/html',
    ...PWA_SECURITY_HEADERS,
    ...overrides
  }

  return Object.fromEntries(
    Object.entries(headers).filter((entry): entry is [string, string] => entry[1] !== null)
  )
}

function site(routes: Record<string, Fixture>): FetchLike {
  const fallback: Fixture = { status: 404, headers: { 'Content-Type': 'text/html' }, body: '' }

  return async (url) => {
    const { status = 200, headers = {}, body } = routes[url] ?? fallback

    return {
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(headers),
      text: async () => body
    }
  }
}

function deployment({
  headers = pageHeaders(),
  html = pageHtml(),
  routes = {}
}: {
  headers?: Record<string, string>
  html?: string
  routes?: Record<string, Fixture>
} = {}) {
  return site({
    [PAGE_URL]: { headers, body: html },
    [ENTRY_URL]: { headers: { 'Content-Type': 'text/javascript' }, body: 'export const a = 1' },
    [PRELOAD_URL]: {
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      body: 'export const b = 2'
    },
    ...routes
  })
}

const production = { url: PAGE_URL, sendsHeaders: true }
const reporting = { url: PAGE_URL, sendsHeaders: true, reportsViolations: true }
const staticHost = { url: PAGE_URL, sendsHeaders: false }

describe('checkDeployment', () => {
  it('accepts a production host that sends the shared headers', async () => {
    expect(await checkDeployment(production, deployment())).toEqual([])
  })

  it.each([CSP_REPORT_PATH, `https://msg.example${CSP_REPORT_PATH}`])(
    'accepts a reporting host that reports to its own endpoint at %s',
    async (reportUri) => {
      const headers = pageHeaders({
        'Content-Security-Policy': `${PWA_HEADER_CONTENT_SECURITY_POLICY}; report-uri ${reportUri}`
      })

      expect(await checkDeployment(reporting, deployment({ headers }))).toEqual([])
    }
  )

  it('accepts a static host that relies on the meta policy', async () => {
    const headers = { 'Content-Type': 'text/html; charset=utf-8' }

    expect(await checkDeployment(staticHost, deployment({ headers }))).toEqual([])
  })

  describe('module scripts', () => {
    it('rejects an SPA fallback that answers a module request with index.html', async () => {
      const routes = { [ENTRY_URL]: { headers: { 'Content-Type': 'text/html' }, body: pageHtml() } }

      expect(await checkDeployment(production, deployment({ routes }))).toEqual([
        `${ENTRY_URL} is served as "text/html", not JavaScript`
      ])
    })

    it('rejects a missing module', async () => {
      const routes = { [PRELOAD_URL]: { status: 404, body: '' } }

      expect(await checkDeployment(production, deployment({ routes }))).toEqual([
        `${PRELOAD_URL} returned HTTP 404`
      ])
    })

    it('rejects JavaScript string evaluation', async () => {
      const routes = {
        [ENTRY_URL]: { headers: { 'Content-Type': 'text/javascript' }, body: 'eval(input)' }
      }

      expect(await checkDeployment(production, deployment({ routes }))).toEqual([
        `${ENTRY_URL}: direct eval`
      ])
    })
  })

  describe('shared response headers', () => {
    it.each(['Referrer-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'])(
      'rejects a production host without %s',
      async (name) => {
        const headers = pageHeaders({ [name]: null })

        expect(await checkDeployment(production, deployment({ headers }))).toEqual([
          `${name} is missing, expected "${PWA_SECURITY_HEADERS[name]}"`
        ])
      }
    )

    it('rejects a referrer policy that leaks the page URL', async () => {
      const headers = pageHeaders({ 'Referrer-Policy': 'strict-origin-when-cross-origin' })

      expect(await checkDeployment(production, deployment({ headers }))).toEqual([
        `Referrer-Policy is "strict-origin-when-cross-origin", expected "no-referrer"`
      ])
    })

    it('rejects a missing framing directive', async () => {
      const headers = pageHeaders({ 'Content-Security-Policy': PWA_CONTENT_SECURITY_POLICY })

      expect(await checkDeployment(production, deployment({ headers }))).toEqual([
        'frame-ancestors is "missing"'
      ])
    })

    it('rejects a header policy that narrows the meta policy', async () => {
      const narrowed = PWA_HEADER_CONTENT_SECURITY_POLICY.replace(
        `connect-src 'self' http: https: ws: wss: blob:`,
        `connect-src 'self'`
      )
      const headers = pageHeaders({ 'Content-Security-Policy': narrowed })
      const problems = await checkDeployment(production, deployment({ headers }))

      expect(problems).toHaveLength(1)
      expect(problems[0]).toMatch(/^header policy .* differs from the build's meta policy/)
    })

    it('rejects a production host without a CSP header', async () => {
      const headers = pageHeaders({ 'Content-Security-Policy': null })

      expect(await checkDeployment(production, deployment({ headers }))).toEqual([
        'sends no Content-Security-Policy header'
      ])
    })
  })

  describe('violation reporting', () => {
    it.each([CSP_REPORT_PATH, 'https://collector.example/csp'])(
      'rejects a production host that reports to %s',
      async (reportUri) => {
        const headers = pageHeaders({
          'Content-Security-Policy': `${PWA_HEADER_CONTENT_SECURITY_POLICY}; report-uri ${reportUri}`
        })

        expect(await checkDeployment(production, deployment({ headers }))).toEqual([
          `production host reports CSP violations to "${reportUri}"`
        ])
      }
    )

    it('rejects a reporting host that reports to another origin', async () => {
      const headers = pageHeaders({
        'Content-Security-Policy': `${PWA_HEADER_CONTENT_SECURITY_POLICY}; report-uri https://collector.example${CSP_REPORT_PATH}`
      })

      expect(await checkDeployment(reporting, deployment({ headers }))).toEqual([
        `CSP reports go to "https://collector.example${CSP_REPORT_PATH}" instead of the same-origin ${CSP_REPORT_PATH}`
      ])
    })

    it('rejects the report-to directive and reporting endpoint headers', async () => {
      const headers = pageHeaders({
        'Content-Security-Policy': `${PWA_HEADER_CONTENT_SECURITY_POLICY}; report-to csp`,
        'Reporting-Endpoints': 'csp="https://collector.example/csp"'
      })

      expect(await checkDeployment(reporting, deployment({ headers }))).toEqual([
        'sends Reporting-Endpoints "csp="https://collector.example/csp""',
        'CSP header uses report-to "csp"'
      ])
    })
  })

  describe('entry document', () => {
    it('rejects a page without the meta policy', async () => {
      const html = pageHtml().replace(/<meta http-equiv="Content-Security-Policy"[^>]+>/, '')

      expect(await checkDeployment(production, deployment({ html }))).toEqual([
        'has no CSP meta policy'
      ])
    })

    it('rejects a meta policy that allows JavaScript evaluation', async () => {
      const html = pageHtml(
        PWA_CONTENT_SECURITY_POLICY.replace(`'wasm-unsafe-eval'`, `'unsafe-eval'`)
      )
      const headers = pageHeaders({
        'Content-Security-Policy': PWA_HEADER_CONTENT_SECURITY_POLICY.replace(
          `'wasm-unsafe-eval'`,
          `'unsafe-eval'`
        )
      })

      expect(await checkDeployment(production, deployment({ headers, html }))).toEqual([
        `meta script-src is "'self' 'unsafe-eval'"`
      ])
    })
  })
})
