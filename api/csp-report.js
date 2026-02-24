const MAX_PAYLOAD_SIZE_BYTES = 64_000
const MAX_VIOLATIONS_TO_LOG = 25

function isAllowedHost(host) {
  return host === 'dev.adamant.im' || host.endsWith('adamant-team.vercel.app')
}

function normalizeReportEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const candidate = entry['csp-report'] ?? entry.body ?? entry

  if (!candidate || typeof candidate !== 'object') {
    return null
  }

  return {
    documentUri:
      candidate['document-uri'] ?? candidate.documentURI ?? candidate.documentUri ?? null,
    violatedDirective:
      candidate['violated-directive'] ??
      candidate.violatedDirective ??
      candidate.effectiveDirective ??
      null,
    blockedUri: candidate['blocked-uri'] ?? candidate.blockedURI ?? candidate.blockedUri ?? null,
    sourceFile: candidate['source-file'] ?? candidate.sourceFile ?? null,
    lineNumber: candidate['line-number'] ?? candidate.lineNumber ?? null,
    columnNumber: candidate['column-number'] ?? candidate.columnNumber ?? null,
    disposition: candidate.disposition ?? null,
    originalPolicy: candidate['original-policy'] ?? candidate.originalPolicy ?? null
  }
}

function parseBody(body) {
  if (!body) {
    return []
  }

  if (Array.isArray(body)) {
    return body
  }

  if (typeof body === 'string') {
    const parsed = JSON.parse(body)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  if (typeof body === 'object') {
    return [body]
  }

  return []
}

export default function handler(request, response) {
  const hostHeader = request.headers.host ?? ''
  const host = String(hostHeader).split(':')[0]

  if (!isAllowedHost(host)) {
    response.status(404).end()
    return
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const rawBody =
    typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {})

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_PAYLOAD_SIZE_BYTES) {
    response.status(413).json({ error: 'Payload Too Large' })
    return
  }

  let reportEntries

  try {
    reportEntries = parseBody(request.body)
  } catch {
    response.status(400).json({ error: 'Invalid JSON payload' })
    return
  }

  const violations = reportEntries
    .map(normalizeReportEntry)
    .filter(Boolean)
    .slice(0, MAX_VIOLATIONS_TO_LOG)

  const payload = {
    event: 'csp-report-only',
    host: hostHeader || null,
    userAgent: request.headers['user-agent'] ?? null,
    count: violations.length,
    violations
  }

  process.stdout.write(`${JSON.stringify(payload)}\n`)
  response.status(204).end()
}
