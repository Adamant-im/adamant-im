// @vitest-environment node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  PWA_CONTENT_SECURITY_POLICY,
  PWA_HEADER_CONTENT_SECURITY_POLICY,
  PWA_SECURITY_HEADERS
} from './cspHardeningPlugin'

type HostCondition = { type: string; value: string | { suf: string } }
type HeaderRule = {
  source: string
  has?: HostCondition[]
  missing?: HostCondition[]
  headers: { key: string; value: string }[]
}

const REPORT_URI_SUFFIX = '; report-uri /api/csp-report'
const NGINX_SNIPPET_PATH = '/etc/nginx/snippets/adamant-pwa-security-headers.conf'

const readRepoFile = (path: string) => readFileSync(resolve(__dirname, '../..', path), 'utf8')

const vercelRules: HeaderRule[] = JSON.parse(readRepoFile('vercel.json')).headers

const toHeaderMap = (rule: HeaderRule) =>
  Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]))

type NginxBlock = { header: string; statements: string[] }

/**
 * Splits an nginx config into blocks with their direct statements. It understands only what the
 * repository examples use: comments, quoted strings, and nested braces.
 */
function parseNginxBlocks(config: string): NginxBlock[] {
  const source = config.replace(/#[^\n]*/g, '')
  const blocks: NginxBlock[] = []
  const stack: NginxBlock[] = [{ header: 'main', statements: [] }]
  let token = ''
  let quote = ''

  for (const char of source) {
    if (quote) {
      token += char
      if (char === quote) quote = ''
    } else if (char === '"' || char === "'") {
      token += char
      quote = char
    } else if (char === '{') {
      stack.push({ header: token.trim().replace(/\s+/g, ' '), statements: [] })
      token = ''
    } else if (char === '}') {
      blocks.push(stack.pop()!)
      token = ''
    } else if (char === ';') {
      stack.at(-1)!.statements.push(token.trim().replace(/\s+/g, ' '))
      token = ''
    } else {
      token += char
    }
  }

  return [...blocks, stack[0]]
}

describe('PWA security headers', () => {
  it('derives the header policy from the meta policy', () => {
    expect(PWA_HEADER_CONTENT_SECURITY_POLICY).toBe(
      `${PWA_CONTENT_SECURITY_POLICY}; frame-ancestors 'none'`
    )
    expect(PWA_HEADER_CONTENT_SECURITY_POLICY).not.toContain(`'unsafe-eval'`)
  })

  describe('vercel.json', () => {
    const catchAllRules = vercelRules.filter((rule) => !rule.has)
    const reportingRules = vercelRules.filter((rule) => rule.has)

    it('sends the shared header set on every rule', () => {
      for (const rule of vercelRules) {
        const { 'Content-Security-Policy': policy, ...rest } = toHeaderMap(rule)
        const { 'Content-Security-Policy': expectedPolicy, ...expectedRest } = PWA_SECURITY_HEADERS

        expect(rest).toEqual(expectedRest)
        expect([expectedPolicy, `${expectedPolicy}${REPORT_URI_SUFFIX}`]).toContain(policy)
      }
    })

    it('covers production hosts without CSP reporting', () => {
      expect(catchAllRules).toHaveLength(1)
      expect(toHeaderMap(catchAllRules[0])['Content-Security-Policy']).toBe(
        PWA_HEADER_CONTENT_SECURITY_POLICY
      )
    })

    // api/csp-report.spec.js checks that the endpoint accepts reports from these hosts.
    it('reports only from explicitly listed hosts', () => {
      for (const rule of reportingRules) {
        expect(toHeaderMap(rule)['Content-Security-Policy']).toBe(
          `${PWA_HEADER_CONTENT_SECURITY_POLICY}${REPORT_URI_SUFFIX}`
        )
        expect(rule.has!.every((condition) => condition.type === 'host')).toBe(true)
      }
    })

    it('sends exactly one policy per host', () => {
      const reportingHosts = reportingRules.flatMap((rule) => rule.has!)

      expect(catchAllRules[0].missing).toEqual(reportingHosts)
    })
  })

  describe('nginx', () => {
    const snippetBlocks = parseNginxBlocks(readRepoFile('deploy/nginx/security-headers.conf'))
    const exampleBlocks = parseNginxBlocks(readRepoFile('deploy/nginx/pwa-site.conf.example'))

    it('mirrors the shared header set in the snippet', () => {
      const [main] = snippetBlocks.slice(-1)
      const headers = Object.fromEntries(
        main.statements.map((statement) => {
          const match = /^add_header (\S+) "([^"]*)" always$/.exec(statement)

          expect(match, statement).not.toBeNull()
          return [match![1], match![2]]
        })
      )

      expect(headers).toEqual(PWA_SECURITY_HEADERS)
    })

    it('includes the snippet wherever the example declares its own headers', () => {
      const blocksWithHeaders = exampleBlocks.filter((block) =>
        block.statements.some((statement) => statement.startsWith('add_header '))
      )

      expect(blocksWithHeaders.length).toBeGreaterThan(0)
      for (const block of blocksWithHeaders) {
        expect(block.statements, block.header).toContain(`include ${NGINX_SNIPPET_PATH}`)
      }
    })

    it('includes the snippet in every server that serves the app', () => {
      const appServers = exampleBlocks.filter(
        (block) =>
          block.header === 'server' &&
          block.statements.some((statement) => statement.startsWith('root '))
      )

      expect(appServers.length).toBeGreaterThan(0)
      for (const server of appServers) {
        expect(server.statements).toContain(`include ${NGINX_SNIPPET_PATH}`)
        expect(server.statements).toContain('access_log off')
      }
    })

    it('keeps the onion backend on loopback', () => {
      const listeners = exampleBlocks
        .filter((block) => block.header === 'server')
        .flatMap((block) => block.statements.filter((statement) => statement.startsWith('listen ')))
        .filter((listen) => !/^listen (80|443 ssl)$/.test(listen))

      expect(listeners).toEqual(['listen 127.0.0.1:8099'])
    })
  })
})
