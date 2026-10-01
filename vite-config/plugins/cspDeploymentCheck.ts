import {
  PWA_CONTENT_SECURITY_POLICY,
  PWA_HEADER_CONTENT_SECURITY_POLICY,
  PWA_SECURITY_HEADERS,
  findUnsafeRuntimeSources
} from './cspHardeningPlugin'

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
const REPORTING_DIRECTIVES = new Set(['report-uri', 'report-to'])
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

export type ParsedPolicy = {
  directives: Map<string, string>
  duplicates: string[]
}

/**
 * Parses one serialized policy the way browsers do: directive names are case-insensitive, and only
 * the first occurrence of a directive takes effect (CSP3, "parse a serialized CSP"). Later
 * occurrences are returned in `duplicates`.
 */
export function parsePolicy(policy: string): ParsedPolicy {
  const directives = new Map<string, string>()
  const duplicates: string[] = []

  for (const token of policy.split(';')) {
    const [name, ...sources] = token.trim().split(/\s+/)
    if (!name) continue

    const directive = name.toLowerCase()
    if (directives.has(directive)) duplicates.push(directive)
    else directives.set(directive, sources.join(' '))
  }

  return { directives, duplicates }
}

// A header value may carry several policies separated by commas; browsers enforce each of them.
const parsePolicyList = (value: string) =>
  value
    .split(',')
    .map((policy) => policy.trim())
    .filter(Boolean)
    .map(parsePolicy)

const META_BASELINE = parsePolicy(PWA_CONTENT_SECURITY_POLICY).directives
const HEADER_BASELINE = parsePolicy(PWA_HEADER_CONTENT_SECURITY_POLICY).directives

const normalizeSources = (sources: string) => sources.split(/\s+/).filter(Boolean).sort().join(' ')

/**
 * Compares a policy with the shared strict baseline directive by directive. Any added directive
 * counts, because one such as `script-src-elem` overrides `script-src` for script elements.
 */
function diffPolicy(label: string, policy: ParsedPolicy, baseline: Map<string, string>) {
  const problems = policy.duplicates.map(
    (name) => `${label} repeats ${name}; browsers apply only its first occurrence`
  )

  for (const [name, expected] of baseline) {
    const actual = policy.directives.get(name)

    if (actual === undefined) problems.push(`${label} is missing ${name}`)
    else if (normalizeSources(actual) !== normalizeSources(expected)) {
      problems.push(`${label} ${name} is "${actual}", expected "${expected}"`)
    }
  }

  for (const [name, sources] of policy.directives) {
    if (!baseline.has(name) && !REPORTING_DIRECTIVES.has(name)) {
      problems.push(`${label} has unexpected ${name} "${sources}"`)
    }
  }

  return problems
}

function isSameOriginReportEndpoint(reportUri: string, pageUrl: string) {
  const endpoint = new URL(reportUri, pageUrl)

  return endpoint.origin === new URL(pageUrl).origin && endpoint.pathname === CSP_REPORT_PATH
}

function checkReporting(target: DeploymentTarget, label: string, policy: ParsedPolicy): string[] {
  const problems: string[] = []
  const reportUri = policy.directives.get('report-uri')

  if (policy.directives.has('report-to')) {
    problems.push(`${label} uses report-to "${policy.directives.get('report-to')}"`)
  }

  if (reportUri === undefined) return problems

  if (!target.reportsViolations) {
    problems.push(`${label} reports to "${reportUri}" on a host that must not report`)
  } else if (reportUri.split(/\s+/).some((uri) => !isSameOriginReportEndpoint(uri, target.url))) {
    problems.push(
      `${label} reports to "${reportUri}" instead of the same-origin ${CSP_REPORT_PATH}`
    )
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

function checkHeaderPolicy(target: DeploymentTarget, headerValue: string | null): string[] {
  if (!headerValue) {
    return target.sendsHeaders ? ['sends no Content-Security-Policy header'] : []
  }

  const policies = parsePolicyList(headerValue)

  if (policies.length !== 1) {
    return [
      `sends ${policies.length} enforced CSP policies instead of one`,
      ...policies.flatMap((policy) => checkReporting(target, 'CSP header', policy))
    ]
  }

  // Browsers enforce the header and the meta policy together, so the header has to match the
  // shared baseline exactly: anything else either narrows or weakens the build's policy.
  return [
    ...diffPolicy('header policy', policies[0], HEADER_BASELINE),
    ...checkReporting(target, 'CSP header', policies[0])
  ]
}

// Report-Only policies are independent of the enforced ones (CSP3) and can report page URLs on
// their own, so they are subject to the same per-host reporting rules.
function checkReportOnlyPolicy(target: DeploymentTarget, headerValue: string | null): string[] {
  if (!headerValue) return []

  if (!target.reportsViolations) {
    return [
      `sends Content-Security-Policy-Report-Only "${headerValue}" on a host that must not report`
    ]
  }

  return parsePolicyList(headerValue).flatMap((policy) =>
    checkReporting(target, 'Report-Only policy', policy)
  )
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
  const metaContents = [
    ...html.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/gi)
  ].map(([, content]) => decodeHtmlAttribute(content))

  if (metaContents.length === 0) return ['has no CSP meta policy']

  return [
    ...(metaContents.length > 1
      ? [`has ${metaContents.length} CSP meta policies instead of one`]
      : []),
    ...diffPolicy('meta policy', parsePolicy(metaContents[0]), META_BASELINE),
    ...checkResponseHeaders(target, response.headers),
    ...checkHeaderPolicy(target, response.headers.get('content-security-policy')),
    ...checkReportOnlyPolicy(target, response.headers.get('content-security-policy-report-only')),
    ...(await checkScripts(target.url, html, fetchImpl))
  ]
}
