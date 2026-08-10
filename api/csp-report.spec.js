// @vitest-environment node

import { Readable } from 'node:stream'

import { afterEach, describe, expect, it, vi } from 'vitest'

import handler, { isAllowedHost } from './csp-report'

function createResponse() {
  return {
    body: undefined,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value
      return this
    },
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    end() {
      return this
    }
  }
}

function createRequest({ body, host = 'preview.adamant-team.vercel.app' } = {}) {
  return {
    body,
    headers: { host, 'user-agent': 'csp-report-test' },
    method: 'POST'
  }
}

describe('CSP report endpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts only the expected Vercel domain boundary', () => {
    expect(isAllowedHost('adamant-team.vercel.app')).toBe(true)
    expect(isAllowedHost('preview.adamant-team.vercel.app')).toBe(true)
    expect(isAllowedHost('adamant-im-git-branch-adamant-team.vercel.app')).toBe(true)
    expect(isAllowedHost('notadamant-team.vercel.app')).toBe(false)
  })

  it('parses a raw application/csp-report request stream', async () => {
    const report = JSON.stringify({
      'csp-report': {
        'document-uri': 'https://preview.adamant-team.vercel.app/',
        'violated-directive': 'script-src',
        'blocked-uri': 'eval'
      }
    })
    const request = Readable.from([report])
    request.body = undefined
    request.headers = {
      host: 'preview.adamant-team.vercel.app',
      'content-type': 'application/csp-report',
      'user-agent': 'csp-report-test'
    }
    request.method = 'POST'
    const response = createResponse()
    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await handler(request, response)

    expect(response.statusCode).toBe(204)
    expect(stdoutWrite).toHaveBeenCalledTimes(1)
    expect(JSON.parse(stdoutWrite.mock.calls[0][0])).toMatchObject({
      event: 'csp-violation',
      count: 1,
      violations: [{ violatedDirective: 'script-src', blockedUri: 'eval' }]
    })
  })

  it('rejects an empty or malformed report instead of logging count zero', async () => {
    const response = createResponse()

    await handler(createRequest({ body: {} }), response)

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({ error: 'Invalid CSP report payload' })
  })

  it('rejects oversized parsed payloads', async () => {
    const response = createResponse()

    await handler(createRequest({ body: 'x'.repeat(64_001) }), response)

    expect(response.statusCode).toBe(413)
    expect(response.body).toEqual({ error: 'Payload Too Large' })
  })
})
