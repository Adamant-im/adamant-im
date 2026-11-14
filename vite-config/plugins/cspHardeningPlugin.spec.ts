// @vitest-environment node

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  PWA_CONTENT_SECURITY_POLICY,
  findUnsafeRuntimeSources,
  removeZodDynamicCompilation,
  replaceEngineIoGlobalFallback
} from './cspHardeningPlugin'

describe('CSP hardening plugin', () => {
  it.each(['util', 'doc', 'compile'])('removes dynamic compilation from Zod %s', (module) => {
    const require = createRequire(import.meta.url)
    const path = join(dirname(require.resolve('zod/package.json')), 'v4/core', `${module}.js`)
    const source = readFileSync(path, 'utf8')

    expect(findUnsafeRuntimeSources(path, source)).toContain(`${path}: Function constructor`)
    const transformed = removeZodDynamicCompilation(source, path)
    expect(transformed).not.toBeNull()
    expect(findUnsafeRuntimeSources(path, transformed!)).toEqual([])
  })

  it('fails closed when an installed Zod module no longer matches its transform', () => {
    expect(() =>
      removeZodDynamicCompilation(
        'export function compileFn() {}',
        '/node_modules/zod/v4/core/compile.js'
      )
    ).toThrow('Review the strict CSP transform')
  })

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
    ['Function constructor', 'const F = Function; const execute = new F("return 1")'],
    ['Function constructor', 'const a=1,F=Function,f=new F("return 1");'],
    ['Function constructor', 'let $=Function;new $("return 1");'],
    ['Function constructor', 'let $$=Function;new $$("return 1");'],
    ['direct eval', 'const value = eval(input)']
  ])('detects %s in generated chunks', (expected, source) => {
    expect(findUnsafeRuntimeSources('assets/index.js', source)).toEqual([
      `assets/index.js: ${expected}`
    ])
  })

  it('allows normal functions and WebAssembly compilation', () => {
    expect(findUnsafeRuntimeSources('assets/index.js', 'function parse() { return 1 }')).toEqual([])
    expect(findUnsafeRuntimeSources('assets/index.js', 'const prop = {type:Function};')).toEqual([])
    expect(findUnsafeRuntimeSources('assets/index.js', 'a.type=Function;')).toEqual([])
    expect(findUnsafeRuntimeSources('assets/index.js', 'a.$$type=Function;')).toEqual([])
    expect(PWA_CONTENT_SECURITY_POLICY).toContain(`script-src 'self' 'wasm-unsafe-eval'`)
    expect(PWA_CONTENT_SECURITY_POLICY).not.toContain(`'unsafe-eval'`)
    expect(PWA_CONTENT_SECURITY_POLICY).not.toContain(`script-src 'self' 'unsafe-inline'`)
  })
})
