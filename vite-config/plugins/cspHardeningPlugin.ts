import type { Plugin } from 'vite'

export const PWA_CONTENT_SECURITY_POLICY = [
  // `frame-ancestors` is intentionally absent: browsers ignore it in meta-delivered policies.
  // Hosting targets that support response headers must enforce it there, as Vercel, the nginx
  // snippet in `deploy/nginx`, and Electron do.
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-src 'none'`,
  `script-src 'self' 'wasm-unsafe-eval'`,
  `style-src 'self' data: 'unsafe-inline'`,
  // Scheme sources preserve user-configured and self-hosted nodes and their media endpoints.
  `img-src 'self' data: blob: http: https:`,
  `media-src 'self' data: blob: http: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' http: https: ws: wss: blob:`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `form-action 'self'`
].join('; ')

// Response-header copy of the meta policy. Header-capable hosts must send exactly this policy:
// browsers enforce every delivered policy, so a stale header narrows the build's meta policy.
export const PWA_HEADER_CONTENT_SECURITY_POLICY = `${PWA_CONTENT_SECURITY_POLICY}; frame-ancestors 'none'`

// Response headers shared by Vercel (`vercel.json`) and self-hosted nginx
// (`deploy/nginx/security-headers.conf`). Contract tests keep both copies identical to this map.
export const PWA_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy': PWA_HEADER_CONTENT_SECURITY_POLICY,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  // The router uses history mode, so URLs carry chat partner addresses.
  'Referrer-Policy': 'no-referrer',
  // Disables the legacy XSS auditor, which could be abused to leak page state.
  'X-XSS-Protection': '0'
}

const ENGINE_IO_GLOBALS_MODULE = /\/engine\.io-client\/build\/esm(?:-debug)?\/globals\.js(?:\?|$)/
const ENGINE_IO_GLOBAL_FALLBACK = /Function\((['"])return this\1\)\(\)/g
const ZOD_CORE_MODULE = /\/node_modules\/zod\/v4\/core\/(util|doc|compile)\.js(?:\?|$)/
const ZOD_EVAL_PROBE = /export const allowsEval = [^\n]*cached\(\(\) => \{[\s\S]*?^\}\);/m
const ZOD_DOC_COMPILE = /^ {4}compile\(\) \{[\s\S]*?^ {4}\}/m
const ZOD_COMPILE_FN = /^export function compileFn\(schema, options\) \{[\s\S]*?^\}/m
const FUNCTION_ALIAS = /\b[A-Za-z_$][\w$]*\s*=\s*Function\s*(?:[;,})]|$)/

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

export function removeZodDynamicCompilation(code: string, id: string): string | null {
  const module = ZOD_CORE_MODULE.exec(id)?.[1]
  if (!module) return null

  // Keep schema validation in the interpreter and fail closed on explicit compilation.
  const replacements = {
    util: [ZOD_EVAL_PROBE, 'export const allowsEval = { value: false };'],
    doc: [ZOD_DOC_COMPILE, '    compile() { throw new Error("Zod JIT is disabled"); }'],
    compile: [
      ZOD_COMPILE_FN,
      'export function compileFn() { throw new ZodCompileUnsupportedError("dynamic compilation under strict CSP"); }'
    ]
  } as const
  const [pattern, replacement] = replacements[module as keyof typeof replacements]
  const hardenedCode = code.replace(pattern, replacement)

  if (
    hardenedCode === code ||
    /\bFunction\b/.test(hardenedCode.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''))
  ) {
    throw new Error(`Zod changed its ${module} module. Review the strict CSP transform.`)
  }

  return hardenedCode
}

export function findUnsafeRuntimeSources(fileName: string, code: string): string[] {
  // Runtime CSP also enforces forms that lexical checks cannot identify.
  const violations = []

  if (hasUnqualifiedCall(code, 'Function') || FUNCTION_ALIAS.test(code)) {
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
      const hardenedCode =
        (isBuild ? removeZodDynamicCompilation(code, id) : null) ??
        replaceEngineIoGlobalFallback(code, id)
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
