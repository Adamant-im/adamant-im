const MAX_PAYLOAD_SIZE_BYTES = 64_000
const MAX_VIOLATIONS_TO_LOG = 25

export function isAllowedHost(host) {
  const normalizedHost = String(host).toLowerCase()

  return (
    normalizedHost === 'dev.adamant.im' ||
    normalizedHost === 'adamant-team.vercel.app' ||
    normalizedHost.endsWith('.adamant-team.vercel.app') ||
    normalizedHost.endsWith('-adamant-team.vercel.app')
  )
}

function normalizeReportEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const candidate = entry['csp-report'] ?? entry.body ?? entry

  if (!candidate || typeof candidate !== 'object') {
    return null
  }

  const normalized = {
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

  return Object.values(normalized).some((value) => value !== null) ? normalized : null
}

function parseBody(body) {
  if (!body) {
    return []
  }

  if (Array.isArray(body)) {
    return body
  }

  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    const parsed = JSON.parse(body.toString())
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  if (typeof body === 'object') {
    return [body]
  }

  return []
}

async function readRequestBody(request) {
  if (request.body !== undefined) {
    return request.body
  }

  if (typeof request[Symbol.asyncIterator] !== 'function') {
    return undefined
  }

  const chunks = []
  let totalSize = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalSize += buffer.byteLength

    if (totalSize > MAX_PAYLOAD_SIZE_BYTES) {
      const error = new Error('Payload Too Large')
      error.code = 'PAYLOAD_TOO_LARGE'
      throw error
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

function getPayloadSize(body) {
  if (body === undefined || body === null) return 0
  if (Buffer.isBuffer(body)) return body.byteLength
  if (typeof body === 'string') return Buffer.byteLength(body, 'utf8')

  return Buffer.byteLength(JSON.stringify(body), 'utf8')
}

export default async function handler(request, response) {
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

  let body

  try {
    body = await readRequestBody(request)
  } catch (error) {
    if (error?.code === 'PAYLOAD_TOO_LARGE') {
      response.status(413).json({ error: 'Payload Too Large' })
      return
    }

    response.status(400).json({ error: 'Invalid CSP report payload' })
    return
  }

  try {
    if (getPayloadSize(body) > MAX_PAYLOAD_SIZE_BYTES) {
      response.status(413).json({ error: 'Payload Too Large' })
      return
    }
  } catch {
    response.status(400).json({ error: 'Invalid CSP report payload' })
    return
  }

  let reportEntries
  try {
    reportEntries = parseBody(body)
  } catch {
    response.status(400).json({ error: 'Invalid JSON payload' })
    return
  }

  const violations = reportEntries
    .map(normalizeReportEntry)
    .filter(Boolean)
    .slice(0, MAX_VIOLATIONS_TO_LOG)

  if (violations.length === 0) {
    response.status(400).json({ error: 'Invalid CSP report payload' })
    return
  }

  const payload = {
    event: 'csp-violation',
    host: hostHeader || null,
    userAgent: request.headers['user-agent'] ?? null,
    count: violations.length,
    violations
  }

  process.stdout.write(`${JSON.stringify(payload)}\n`)
  response.status(204).end()
}
