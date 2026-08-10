// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  PWA_CONTENT_SECURITY_POLICY,
  findUnsafeRuntimeSources,
  replaceEngineIoGlobalFallback
} from './cspHardeningPlugin'

describe('CSP hardening plugin', () => {
  it('removes the engine.io global Function fallback', () => {
    const source = `const root = self || Function("return this")()`

    expect(
      replaceEngineIoGlobalFallback(
        source,
        '/workspace/node_modules/engine.io-client/build/esm/globals.js'
      )
    ).toBe('const root = self || globalThis')
  })

  it('leaves unrelated modules unchanged', () => {
    expect(replaceEngineIoGlobalFallback('Function("return this")()', '/src/example.js')).toBeNull()
  })

  it.each([
    ['Function constructor', 'const globalObject = Function("return this")()'],
    ['Function constructor', 'const execute = new Function("return 1")'],
    ['direct eval', 'const value = eval(input)']
  ])('detects %s in generated chunks', (expected, source) => {
    expect(findUnsafeRuntimeSources('assets/index.js', source)).toEqual([
      `assets/index.js: ${expected}`
    ])
  })

  it('allows normal functions and WebAssembly compilation', () => {
    expect(findUnsafeRuntimeSources('assets/index.js', 'function parse() { return 1 }')).toEqual([])
    expect(PWA_CONTENT_SECURITY_POLICY).toContain(`script-src 'self' 'wasm-unsafe-eval'`)
    expect(PWA_CONTENT_SECURITY_POLICY).not.toContain(`'unsafe-eval'`)
    expect(PWA_CONTENT_SECURITY_POLICY).not.toContain(`script-src 'self' 'unsafe-inline'`)
  })
})
