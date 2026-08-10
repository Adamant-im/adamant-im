import type { Plugin } from 'vite'

export const PWA_CONTENT_SECURITY_POLICY = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-src 'none'`,
  `script-src 'self' 'wasm-unsafe-eval'`,
  `style-src 'self' data: 'unsafe-inline'`,
  `img-src 'self' data: blob: http: https:`,
  `media-src 'self' data: blob: http: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' http: https: ws: wss: blob:`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `form-action 'self'`
].join('; ')

const ENGINE_IO_GLOBALS_MODULE = /\/engine\.io-client\/build\/esm(?:-debug)?\/globals\.js(?:\?|$)/
const ENGINE_IO_GLOBAL_FALLBACK = /Function\((['"])return this\1\)\(\)/g

function isIdentifierOrPropertyCharacter(value: string | undefined): boolean {
  if (!value) return false

  const code = value.charCodeAt(0)
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    value === '_' ||
    value === '$' ||
    value === '.'
  )
}

function hasUnqualifiedCall(code: string, functionName: string): boolean {
  const needle = `${functionName}(`
  let index = code.indexOf(needle)

  while (index !== -1) {
    if (!isIdentifierOrPropertyCharacter(code[index - 1])) return true
    index = code.indexOf(needle, index + needle.length)
  }

  return false
}

export function replaceEngineIoGlobalFallback(code: string, id: string): string | null {
  if (!ENGINE_IO_GLOBALS_MODULE.test(id)) return null

  const hardenedCode = code.replace(ENGINE_IO_GLOBAL_FALLBACK, 'globalThis')
  return hardenedCode === code ? null : hardenedCode
}

export function findUnsafeRuntimeSources(fileName: string, code: string): string[] {
  const violations = []

  if (hasUnqualifiedCall(code, 'Function')) {
    violations.push(`${fileName}: Function constructor`)
  }

  if (hasUnqualifiedCall(code, 'eval')) {
    violations.push(`${fileName}: direct eval`)
  }

  return violations
}

export function cspHardeningPlugin(): Plugin {
  let isBuild = false

  return {
    name: 'adamant-csp-hardening',
    enforce: 'pre',

    configResolved(config) {
      isBuild = config.command === 'build'
    },

    transform(code, id) {
      const hardenedCode = replaceEngineIoGlobalFallback(code, id)
      return hardenedCode ? { code: hardenedCode, map: null } : null
    },

    transformIndexHtml() {
      if (!isBuild) return

      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: PWA_CONTENT_SECURITY_POLICY
          },
          injectTo: 'head-prepend'
        }
      ]
    },

    generateBundle(_options, bundle) {
      const violations = Object.values(bundle).flatMap((output) =>
        output.type === 'chunk' ? findUnsafeRuntimeSources(output.fileName, output.code) : []
      )

      if (violations.length > 0) {
        this.error(`Strict CSP build gate rejected runtime code:\n${violations.join('\n')}`)
      }
    }
  }
}
