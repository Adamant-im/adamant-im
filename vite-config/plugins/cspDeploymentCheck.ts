import { PWA_SECURITY_HEADERS, findUnsafeRuntimeSources } from './cspHardeningPlugin'

export type DeploymentTarget = {
  url: string
  // Whether the host can send response headers. Static hosts rely on the meta policy alone.
  sendsHeaders: boolean
  // Only these hosts may report CSP violations, and only to their own report endpoint.
  reportsViolations?: boolean
  // Violations caused by content the host itself injects into the page, as
  // `<effective directive> <blocked URI prefix>`. The browser check fails on any other violation.
  expectedViolations?: readonly string[]
}

// The public deployment matrix from issue #927. Onion targets need Tor and are checked separately.
export const DEPLOYMENT_TARGETS: readonly DeploymentTarget[] = [
  // Mainnet
  { url: 'https://msg.adamant.im/', sendsHeaders: true },
  { url: 'https://adm.im/', sendsHeaders: true },
  { url: 'https://msgtest.adamant.im/', sendsHeaders: true },
  { url: 'https://msg2.adamant.im/', sendsHeaders: true },
  { url: 'https://dev.adamant.im/', sendsHeaders: true, reportsViolations: true },
  { url: 'https://adamant-im.github.io/adamant-im/', sendsHeaders: false },
  // Massa DeWeb (`adm.massa`) through a public DeWeb provider. The provider injects its DeWeb
  // label, a Google Fonts import and an inline script; the strict policy blocks both by design,
  // which also keeps the font host from seeing visitors.
  {
    url: 'https://adm.deweb.half-red.net/',
    sendsHeaders: false,
    expectedViolations: ['style-src-elem https://fonts.googleapis.com/', 'script-src-elem inline']
  },
  // Testnet
  { url: 'https://msg-adamant-testnet.surge.sh/', sendsHeaders: false },
  { url: 'http://msg-testnet.adamant.im/', sendsHeaders: false },
  { url: 'https://dev-adamant-testnet.surge.sh/', sendsHeaders: false },
  { url: 'http://dev-testnet.adamant.im/', sendsHeaders: false }
]

export const CSP_REPORT_PATH = '/api/csp-report'

// The subset of the Fetch API the check needs, so tests can serve fixtures without a network.
export type FetchResponse = Pick<Response, 'ok' | 'status' | 'text'> & {
  headers: Pick<Headers, 'get'>
}
export type FetchLike = (url: string) => Promise<FetchResponse>

const REQUEST_TIMEOUT_MS = 30_000
const HEADER_ONLY_DIRECTIVES = new Set(['frame-ancestors', 'report-uri', 'report-to'])
const REPORTING_HEADERS = ['Report-To', 'Reporting-Endpoints']
const JAVASCRIPT_MIME = /^(?:text|application)\/(?:x-)?(?:javascript|ecmascript)\s*(?:;|$)/i

const defaultFetch: FetchLike = (url) =>
  fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })

const decodeHtmlAttribute = (value: string) =>
  value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

export function parsePolicy(policy: string): Map<string, string> {
  return new Map(
    policy
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name.toLowerCase(), sources.join(' ')])
  )
}

const formatPolicy = (policy: Map<string, string>) =>
  [...policy].map(([name, sources]) => `${name} ${sources}`.trim()).join('; ')

function withoutHeaderOnlyDirectives(policy: Map<string, string>) {
  return new Map([...policy].filter(([name]) => !HEADER_ONLY_DIRECTIVES.has(name)))
}

const samePolicy = (a: Map<string, string>, b: Map<string, string>) =>
  a.size === b.size && [...a].every(([name, sources]) => b.get(name) === sources)

function isSameOriginReportEndpoint(reportUri: string, pageUrl: string) {
  const endpoint = new URL(reportUri, pageUrl)

  return endpoint.origin === new URL(pageUrl).origin && endpoint.pathname === CSP_REPORT_PATH
}

function checkReporting(target: DeploymentTarget, policy: Map<string, string>): string[] {
  const problems: string[] = []
  const reportUri = policy.get('report-uri')

  if (policy.has('report-to')) {
    problems.push(`CSP header uses report-to "${policy.get('report-to')}"`)
  }

  if (reportUri === undefined) return problems

  if (!target.reportsViolations) {
    problems.push(`production host reports CSP violations to "${reportUri}"`)
  } else if (reportUri.split(/\s+/).some((uri) => !isSameOriginReportEndpoint(uri, target.url))) {
    problems.push(`CSP reports go to "${reportUri}" instead of the same-origin ${CSP_REPORT_PATH}`)
  }

  return problems
}

function checkResponseHeaders(target: DeploymentTarget, headers: Pick<Headers, 'get'>): string[] {
  const problems: string[] = []

  for (const name of REPORTING_HEADERS) {
    const value = headers.get(name)
    if (value) problems.push(`sends ${name} "${value}"`)
  }

  if (!target.sendsHeaders) return problems

  for (const [name, expected] of Object.entries(PWA_SECURITY_HEADERS)) {
    if (name === 'Content-Security-Policy') continue

    const actual = headers.get(name)
    if (actual !== expected) {
      problems.push(
        `${name} is ${actual === null ? 'missing' : `"${actual}"`}, expected "${expected}"`
      )
    }
  }

  return problems
}

function checkHeaderPolicy(
  target: DeploymentTarget,
  headerValue: string | null,
  metaPolicy: Map<string, string>
): string[] {
  if (!headerValue) {
    return target.sendsHeaders ? ['sends no Content-Security-Policy header'] : []
  }

  const problems: string[] = []
  const headerPolicy = parsePolicy(headerValue)
  const comparable = withoutHeaderOnlyDirectives(headerPolicy)

  // Browsers enforce both policies, so any difference silently narrows the build's policy.
  if (!samePolicy(comparable, metaPolicy)) {
    problems.push(
      `header policy "${formatPolicy(comparable)}" differs from the build's meta policy "${formatPolicy(metaPolicy)}"`
    )
  }

  if (headerPolicy.get('frame-ancestors') !== `'none'`) {
    problems.push(`frame-ancestors is "${headerPolicy.get('frame-ancestors') ?? 'missing'}"`)
  }

  return [...problems, ...checkReporting(target, headerPolicy)]
}

async function checkScripts(pageUrl: string, html: string, fetchImpl: FetchLike) {
  const problems: string[] = []
  const scriptUrls = [
    ...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g),
    ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)
  ].map(([, src]) => new URL(src, pageUrl).href)

  if (scriptUrls.length === 0) return ['references no module scripts']

  for (const scriptUrl of scriptUrls) {
    const response = await fetchImpl(scriptUrl)
    const contentType = response.headers.get('content-type') ?? ''

    if (!response.ok) {
      problems.push(`${scriptUrl} returned HTTP ${response.status}`)
      continue
    }

    // An SPA fallback answers missing modules with index.html and HTTP 200; browsers refuse to
    // run such a module, so the scan below would pass while the app cannot start.
    if (!JAVASCRIPT_MIME.test(contentType)) {
      problems.push(
        `${scriptUrl} is served as "${contentType || 'no content type'}", not JavaScript`
      )
      continue
    }

    problems.push(...findUnsafeRuntimeSources(scriptUrl, await response.text()))
  }

  return problems
}

/**
 * Checks one deployed target and returns every problem found; an empty list means the target
 * enforces the strict policy, sends the shared headers, and reports violations only where allowed.
 */
export async function checkDeployment(
  target: DeploymentTarget,
  fetchImpl: FetchLike = defaultFetch
): Promise<string[]> {
  const response = await fetchImpl(target.url)
  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) return [`returned HTTP ${response.status}`]
  if (!/^text\/html\b/i.test(contentType)) {
    return [`is served as "${contentType || 'no content type'}", not HTML`]
  }

  const html = await response.text()
  const metaContent = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i.exec(
    html
  )?.[1]

  if (!metaContent) return ['has no CSP meta policy']

  const metaPolicy = parsePolicy(decodeHtmlAttribute(metaContent))
  const problems: string[] = []

  if (metaPolicy.get('script-src') !== `'self' 'wasm-unsafe-eval'`) {
    problems.push(`meta script-src is "${metaPolicy.get('script-src') ?? 'missing'}"`)
  }

  problems.push(
    ...checkResponseHeaders(target, response.headers),
    ...checkHeaderPolicy(target, response.headers.get('content-security-policy'), metaPolicy),
    ...(await checkScripts(target.url, html, fetchImpl))
  )

  return problems
}
