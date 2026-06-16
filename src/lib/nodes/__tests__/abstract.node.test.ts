import { describe, expect, it } from 'vitest'
import { Node } from '../abstract.node'
import { NODE_LABELS } from '../constants'
import type { HealthcheckResult } from '../types'

class TestNode extends Node<null> {
  protected checkHealth(): Promise<HealthcheckResult> {
    return Promise.resolve({ height: 0, ping: 0 })
  }

  protected buildClient() {
    return null
  }
}

function createNode(version: string, minNodeVersion: string) {
  return new TestNode(
    { url: 'https://node.example' },
    'adm',
    'node',
    NODE_LABELS.AdmNode,
    version,
    minNodeVersion
  )
}

describe('Node#hasMinNodeVersion', () => {
  it('returns true when no minimum version is required', () => {
    const node = createNode('0.10.0', '')

    expect(node.hasMinNodeVersion()).toBe(true)
  })

  it('returns true when version is greater than the minimum (double-digit minor)', () => {
    const node = createNode('0.10.0', '0.8.0')

    expect(node.hasMinNodeVersion()).toBe(true)
  })

  it('returns true when version equals the minimum', () => {
    const node = createNode('0.8.0', '0.8.0')

    expect(node.hasMinNodeVersion()).toBe(true)
  })

  it('returns false when version is lower than the minimum', () => {
    const node = createNode('0.7.0', '0.8.0')

    expect(node.hasMinNodeVersion()).toBe(false)
  })

  it('returns true for a higher major version', () => {
    const node = createNode('1.0.0', '0.8.0')

    expect(node.hasMinNodeVersion()).toBe(true)
  })

  it('falls back to string comparison when version is not valid semver', () => {
    const node = createNode('not-a-version', '0.8.0')

    expect(node.hasMinNodeVersion()).toBe('not-a-version' >= '0.8.0')
  })
})
