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
        'header policy is missing frame-ancestors'
      ])
    })

    it('applies the first of duplicate directives, as browsers do', async () => {
      const headers = pageHeaders({
        'Content-Security-Policy': `frame-ancestors *; ${PWA_HEADER_CONTENT_SECURITY_POLICY}`
      })

      expect(await checkDeployment(production, deployment({ headers }))).toEqual([
        'header policy repeats frame-ancestors; browsers apply only its first occurrence',
        `header policy frame-ancestors is "*", expected "'none'"`
      ])
    })

    it('rejects a header policy that narrows the shared policy', async () => {
      const narrowed = PWA_HEADER_CONTENT_SECURITY_POLICY.replace(
        `connect-src 'self' http: https: ws: wss: blob:`,
        `connect-src 'self'`
      )
      const headers = pageHeaders({ 'Content-Security-Policy': narrowed })

      expect(await checkDeployment(production, deployment({ headers }))).toEqual([
        `header policy connect-src is "'self'", expected "'self' http: https: ws: wss: blob:"`
      ])
    })

    it('rejects several enforced policies in one response', async () => {
      const headers = pageHeaders({
        'Content-Security-Policy': `${PWA_HEADER_CONTENT_SECURITY_POLICY}, script-src 'self'`
      })

      expect(await checkDeployment(production, deployment({ headers }))).toEqual([
        'sends 2 enforced CSP policies instead of one'
      ])
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
          `CSP header reports to "${reportUri}" on a host that must not report`
        ])
      }
    )

    it('rejects a reporting host that reports to another origin', async () => {
      const headers = pageHeaders({
        'Content-Security-Policy': `${PWA_HEADER_CONTENT_SECURITY_POLICY}; report-uri https://collector.example${CSP_REPORT_PATH}`
      })

      expect(await checkDeployment(reporting, deployment({ headers }))).toEqual([
        `CSP header reports to "https://collector.example${CSP_REPORT_PATH}" instead of the same-origin ${CSP_REPORT_PATH}`
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

    describe('Report-Only policies', () => {
      it.each([CSP_REPORT_PATH, 'https://collector.example/csp'])(
        'rejects a Report-Only policy on a production host that reports to %s',
        async (reportUri) => {
          const reportOnly = `default-src 'self'; report-uri ${reportUri}`
          const headers = pageHeaders({ 'Content-Security-Policy-Report-Only': reportOnly })

          expect(await checkDeployment(production, deployment({ headers }))).toEqual([
            `sends Content-Security-Policy-Report-Only "${reportOnly}" on a host that must not report`
          ])
        }
      )

      it('rejects a Report-Only policy that reports to another origin', async () => {
        const headers = pageHeaders({
          'Content-Security-Policy-Report-Only': `default-src 'self'; report-uri https://collector.example/csp`
        })

        expect(await checkDeployment(reporting, deployment({ headers }))).toEqual([
          `Report-Only policy reports to "https://collector.example/csp" instead of the same-origin ${CSP_REPORT_PATH}`
        ])
      })

      it('checks every Report-Only policy in the header', async () => {
        const headers = pageHeaders({
          'Content-Security-Policy-Report-Only': `default-src 'self'; report-uri ${CSP_REPORT_PATH}, img-src 'self'; report-to csp`
        })

        expect(await checkDeployment(reporting, deployment({ headers }))).toEqual([
          'Report-Only policy uses report-to "csp"'
        ])
      })

      it('accepts a Report-Only policy that reports to its own endpoint', async () => {
        const headers = pageHeaders({
          'Content-Security-Policy-Report-Only': `default-src 'self'; report-uri ${CSP_REPORT_PATH}`
        })

        expect(await checkDeployment(reporting, deployment({ headers }))).toEqual([])
      })
    })
  })

  describe('entry document', () => {
    it('rejects a page without the meta policy', async () => {
      const html = pageHtml().replace(/<meta http-equiv="Content-Security-Policy"[^>]+>/, '')

      expect(await checkDeployment(production, deployment({ html }))).toEqual([
        'has no active CSP meta policy in the document head'
      ])
    })

    // HTML only installs a policy from an active meta element in <head>; matching text elsewhere
    // is never enforced, so these pages run without a policy on a static host.
    it.each([
      ['inside an HTML comment', (meta: string) => ({ head: `<!-- ${meta} -->`, body: '' })],
      [
        'inside template contents',
        (meta: string) => ({ head: `<template>${meta}</template>`, body: '' })
      ],
      ['in the body', (meta: string) => ({ head: '', body: meta })]
    ])('rejects a policy %s', async (_label, place) => {
      const html = pageHtml().replace(
        /(<meta http-equiv="Content-Security-Policy"[^>]+>)(.*<\/head><body>)/,
        (_match, meta: string, between: string) => {
          const { head, body } = place(meta)

          return `${head}${between}${body}`
        }
      )

      expect(await checkDeployment(staticHost, deployment({ html }))).toEqual([
        'has no active CSP meta policy in the document head'
      ])
    })

    it('rejects a meta element with an empty policy', async () => {
      const html = pageHtml().replace(/content="[^"]+"/, 'content=" "')

      expect(await checkDeployment(staticHost, deployment({ html }))).toEqual([
        'has no active CSP meta policy in the document head'
      ])
    })

    it('rejects a policy that comes after a script', async () => {
      const html = pageHtml().replace('<head>', '<head><script src="/early.js"></script>')

      expect(await checkDeployment(staticHost, deployment({ html }))).toEqual([
        'CSP meta policy comes after <script /early.js>, which it does not cover'
      ])
    })

    it('accepts an active meta element regardless of attribute case and order', async () => {
      const policy = PWA_CONTENT_SECURITY_POLICY.replace(/'/g, '&#39;')
      const html = pageHtml().replace(
        /<meta http-equiv="Content-Security-Policy"[^>]+>/,
        `<META CONTENT="${policy}" HTTP-EQUIV="content-security-policy">`
      )

      expect(await checkDeployment(staticHost, deployment({ html }))).toEqual([])
    })

    it('ignores module scripts in inert markup', async () => {
      const html = pageHtml().replace(
        '</body>',
        '<template><script type="module" src="/assets/missing.js"></script></template></body>'
      )

      expect(await checkDeployment(staticHost, deployment({ html }))).toEqual([])
    })

    it('rejects a meta policy that allows JavaScript evaluation', async () => {
      const html = pageHtml(
        PWA_CONTENT_SECURITY_POLICY.replace(`'wasm-unsafe-eval'`, `'unsafe-eval'`)
      )

      expect(await checkDeployment(production, deployment({ html }))).toEqual([
        `meta policy script-src is "'self' 'unsafe-eval'", expected "'self' 'wasm-unsafe-eval'"`
      ])
    })

    it('rejects a directive that overrides script-src for script elements', async () => {
      const override = `script-src-elem 'self' https://collector.example`
      const html = pageHtml(`${PWA_CONTENT_SECURITY_POLICY}; ${override}`)
      const headers = pageHeaders({
        'Content-Security-Policy': `${PWA_HEADER_CONTENT_SECURITY_POLICY}; ${override}`
      })

      expect(await checkDeployment(production, deployment({ headers, html }))).toEqual([
        `meta policy has unexpected script-src-elem "'self' https://collector.example"`,
        `header policy has unexpected script-src-elem "'self' https://collector.example"`
      ])
    })

    it('rejects a meta policy without one of the shared directives', async () => {
      const html = pageHtml(PWA_CONTENT_SECURITY_POLICY.replace(`object-src 'none'; `, ''))

      expect(await checkDeployment(production, deployment({ html }))).toEqual([
        'meta policy is missing object-src'
      ])
    })

    it('applies the first of duplicate meta directives', async () => {
      const html = pageHtml(`script-src 'self' 'unsafe-inline'; ${PWA_CONTENT_SECURITY_POLICY}`)

      expect(await checkDeployment(production, deployment({ html }))).toEqual([
        'meta policy repeats script-src; browsers apply only its first occurrence',
        `meta policy script-src is "'self' 'unsafe-inline'", expected "'self' 'wasm-unsafe-eval'"`
      ])
    })

    it('rejects a second meta policy', async () => {
      const html = pageHtml().replace(
        '</head>',
        `<meta http-equiv="Content-Security-Policy" content="img-src *"></head>`
      )

      expect(await checkDeployment(production, deployment({ html }))).toEqual([
        'has 2 CSP meta policies instead of one'
      ])
    })
  })
})
