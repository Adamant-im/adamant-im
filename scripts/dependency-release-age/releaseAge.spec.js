// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  QUARANTINE_DAYS,
  collectLockedVersions,
  evaluateReleaseAges,
  parseReleaseAgeExceptions
} from './releaseAge.mjs'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-11-14T12:00:00.000Z')
const daysAgo = (days) => new Date(NOW - days * DAY_MS).toISOString()

const registryEntry = (name, version) => ({
  version,
  resolved: `https://registry.npmjs.org/${name}/-/${name.split('/').at(-1)}-${version}.tgz`
})

const exception = (overrides = {}) => ({
  package: 'fresh-fix',
  version: '2.0.1',
  advisory: 'GHSA-mrhx-c7xc-m3w5',
  reason: 'Patched release for an exploited advisory',
  ...overrides
})

describe('collectLockedVersions', () => {
  it('collects lockfile versions, aliases, nested copies, and the pinned npm release', () => {
    const versions = collectLockedVersions(
      {
        packages: {
          '': { name: 'adamant-im', version: '4.12.0' },
          'node_modules/zod': registryEntry('zod', '4.6.7'),
          'node_modules/@scope/pkg': registryEntry('@scope/pkg', '1.0.0'),
          'node_modules/parent/node_modules/zod': registryEntry('zod', '3.25.76'),
          'node_modules/string-width-cjs': {
            ...registryEntry('string-width', '4.2.3'),
            name: 'string-width'
          }
        }
      },
      'npm@12.2.2+sha512.abc'
    )

    expect(Object.fromEntries([...versions].map(([name, set]) => [name, [...set]]))).toEqual({
      zod: ['4.6.7', '3.25.76'],
      '@scope/pkg': ['1.0.0'],
      'string-width': ['4.2.3'],
      npm: ['12.2.2']
    })
  })

  it.each([
    ['a foreign registry', { version: '1.0.0', resolved: 'https://evil.example/pkg-1.0.0.tgz' }],
    ['a local link', { link: true, resolved: 'packages/pkg' }],
    ['a missing version', { resolved: 'https://registry.npmjs.org/pkg/-/pkg-1.0.0.tgz' }]
  ])('refuses a lockfile entry with %s', (_label, entry) => {
    expect(() =>
      collectLockedVersions({ packages: { 'node_modules/pkg': entry } }, 'npm@12.2.2')
    ).toThrow('Cannot verify the npm release date for node_modules/pkg')
  })

  it.each([undefined, 'pnpm@10.0.0', 'npm'])('requires a pinned npm version, got %s', (value) => {
    expect(() => collectLockedVersions({ packages: {} }, value)).toThrow(
      'Expected a pinned npm version'
    )
  })
})

describe('parseReleaseAgeExceptions', () => {
  it('accepts reviewed exceptions for GHSA and CVE advisories', () => {
    const exceptions = parseReleaseAgeExceptions([
      exception(),
      exception({ package: '@scope/pkg', version: '1.0.0-rc.1', advisory: 'CVE-2026-12345' })
    ])

    expect([...exceptions.keys()]).toEqual(['fresh-fix@2.0.1', '@scope/pkg@1.0.0-rc.1'])
  })

  it('keeps the committed exceptions file valid', () => {
    const committed = JSON.parse(
      readFileSync('.github/dependency-release-age-exceptions.json', 'utf8')
    )

    expect(() => parseReleaseAgeExceptions(committed)).not.toThrow()
  })

  it.each([
    ['a non-array file', { 'fresh-fix': '2.0.1' }, 'must be a JSON array'],
    ['a non-object entry', ['fresh-fix@2.0.1'], 'must be an object'],
    ['an unknown field', [exception({ expires: '2099-01-01' })], 'unknown field "expires"'],
    ['a missing advisory', [exception({ advisory: undefined })], 'non-empty "advisory"'],
    ['a blank reason', [exception({ reason: '  ' })], 'non-empty "reason"'],
    ['a version range', [exception({ version: '^2.0.1' })], 'one exact version'],
    ['a wildcard version', [exception({ version: '*' })], 'one exact version'],
    ['a free-text advisory', [exception({ advisory: 'urgent' })], 'GHSA or CVE identifier'],
    ['a duplicate', [exception(), exception({ reason: 'again' })], 'repeats fresh-fix@2.0.1']
  ])('rejects %s', (_label, value, message) => {
    expect(() => parseReleaseAgeExceptions(value)).toThrow(message)
  })
})

describe('evaluateReleaseAges', () => {
  const evaluate = ({ versions, times, exceptions = [] }) =>
    evaluateReleaseAges({
      versionsByName: new Map(
        Object.entries(versions).map(([name, list]) => [name, new Set(list)])
      ),
      releaseTimesByName: new Map(Object.entries(times)),
      exceptions: parseReleaseAgeExceptions(exceptions),
      now: NOW
    })

  it('passes versions that are at least as old as the quarantine', () => {
    const result = evaluate({
      versions: { aged: ['1.0.0', '1.1.0'] },
      times: { aged: { '1.0.0': daysAgo(400), '1.1.0': daysAgo(QUARANTINE_DAYS) } }
    })

    expect(result).toMatchObject({ versionCount: 2, findings: [], exempted: [], notices: [] })
    expect(result.earliestEligibleTime).toBe(NOW - QUARANTINE_DAYS * DAY_MS)
  })

  it('reports a version that is younger than the quarantine', () => {
    const published = daysAgo(QUARANTINE_DAYS - 0.01)
    const result = evaluate({
      versions: { 'fresh-fix': ['2.0.1'] },
      times: { 'fresh-fix': { '2.0.1': published } }
    })

    expect(result.findings).toEqual([`fresh-fix@2.0.1: published ${published}`])
  })

  it('allows a young version only through its own reviewed exception', () => {
    const published = daysAgo(1)
    const result = evaluate({
      versions: { 'fresh-fix': ['2.0.1', '2.0.2'], other: ['2.0.1'] },
      times: {
        'fresh-fix': { '2.0.1': published, '2.0.2': published },
        other: { '2.0.1': published }
      },
      exceptions: [exception()]
    })

    expect(result.exempted).toEqual([
      `fresh-fix@2.0.1: published ${published}, allowed by GHSA-mrhx-c7xc-m3w5`
    ])
    expect(result.findings).toEqual([
      `fresh-fix@2.0.2: published ${published}`,
      `other@2.0.1: published ${published}`
    ])
  })

  it('reports an exception that does not match a locked version', () => {
    const result = evaluate({
      versions: { 'fresh-fix': ['2.0.2'] },
      times: { 'fresh-fix': { '2.0.2': daysAgo(30) } },
      exceptions: [exception()]
    })

    expect(result.findings).toEqual([
      'fresh-fix@2.0.1: the exception does not match a locked version, remove it'
    ])
  })

  it('only warns about an exception that the version has outgrown', () => {
    const result = evaluate({
      versions: { 'fresh-fix': ['2.0.1'] },
      times: { 'fresh-fix': { '2.0.1': daysAgo(QUARANTINE_DAYS + 1) } },
      exceptions: [exception()]
    })

    expect(result.findings).toEqual([])
    expect(result.exempted).toEqual([])
    expect(result.notices).toEqual([
      'fresh-fix@2.0.1: the exception is no longer needed, remove it'
    ])
  })

  it('never lets an exception cover a version that cannot be dated', () => {
    const result = evaluate({
      versions: { 'fresh-fix': ['2.0.1'], unreachable: ['1.0.0'], undated: ['1.0.0'] },
      times: {
        'fresh-fix': { '2.0.0': daysAgo(30) },
        unreachable: new Error('cannot read npm metadata'),
        undated: undefined
      },
      exceptions: [
        exception(),
        exception({ package: 'unreachable', version: '1.0.0' }),
        exception({ package: 'undated', version: '1.0.0' })
      ]
    })

    expect(result.exempted).toEqual([])
    expect(result.findings).toEqual([
      'fresh-fix@2.0.1: npm publication time is unavailable',
      'undated@1.0.0: npm publication time is unavailable',
      'unreachable@1.0.0: cannot read npm metadata'
    ])
  })
})
