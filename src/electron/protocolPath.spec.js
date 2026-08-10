// @vitest-environment node

import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { resolveProtocolFilePath } from './protocolPath'

const staticRoot = path.resolve('/app/dist-electron')

describe('Electron protocol path resolution', () => {
  it.each(['/', '/options', '/transactions/ADM/123'])(
    'serves index.html for SPA route %s',
    (route) => {
      expect(resolveProtocolFilePath(staticRoot, route)).toBe(path.join(staticRoot, 'index.html'))
    }
  )

  it('serves an asset path with an extension directly', () => {
    expect(resolveProtocolFilePath(staticRoot, '/assets/index-123.js')).toBe(
      path.join(staticRoot, 'assets/index-123.js')
    )
  })

  it('rejects paths that resolve outside the renderer bundle', () => {
    expect(resolveProtocolFilePath(staticRoot, '/../secrets.txt')).toBeNull()
  })
})
