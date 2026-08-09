import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'

/**
 * Credentials for the env-gated live tests, read in a way that does not depend on the
 * working directory.
 *
 * Every live spec used to call `loadEnv({ path: '.env.local' })` directly. dotenv resolves a
 * relative `path` against `process.cwd()`, so invoking vitest or playwright from anywhere but
 * the repository root — a different directory, an IDE runner, a monorepo wrapper — found no
 * file and silently disabled the entire live suite. A skip is reported as a success, so this
 * looked exactly like a clean run; it is what made the live suite appear to pass sometimes and
 * skip other times. Resolving against this module's own URL removes the ambiguity.
 */
// `import.meta.url` is handed to `fileURLToPath` as a string rather than as a `new URL(...)`
// object on purpose: under the jsdom environment the global `URL` is jsdom's implementation,
// and Node rejects one of its instances with "The URL must be of scheme file". Passing the
// string keeps the parsing inside Node, so this resolves identically in both environments.
const ENV_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../../.env.local')

// The file is absent in CI, where the values arrive through the real environment instead.
// `loadEnv` still populates `process.env` for anything downstream that reads it; the parsed
// copy is what the gates below consult.
const fileEnv = loadEnv({ path: ENV_FILE, quiet: true }).parsed ?? {}

// Read through a computed property rather than the `process.env` literal: `vite-base.config.ts`
// declares `define: { 'process.env': {} }`, which rewrites that exact token in transformed
// modules. The literal is not currently rewritten in these specs, but a gate that fails open
// into a silent skip is not worth leaving exposed to a config change.
const processEnv: Record<string, string | undefined> =
  (globalThis as Record<string, any>)['process']?.env ?? {}

export const readLiveEnv = (name: string): string | undefined => {
  const value = fileEnv[name] ?? processEnv[name]
  const trimmed = typeof value === 'string' ? value.trim() : ''

  return trimmed.length > 0 ? trimmed : undefined
}

export const isCI = Boolean(processEnv.CI)

/**
 * Explains a skip on the one occasion it is unexpected: locally, with no file to read from.
 * Silent skips are the failure mode this module exists to prevent.
 */
export const warnMissingLiveEnv = (runner: string, names: string[], hint: string) => {
  if (isCI || names.every((name) => readLiveEnv(name))) return

  console.warn(
    `\n[${runner}] ${names.join(' / ')} not set — the matching live tests are skipped.\n` +
      `Looked in ${ENV_FILE}\n${hint}\n`
  )
}
