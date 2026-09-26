import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { resolveNetworkConfigVariant, type NetworkBuildTarget } from './networkConfigPlugin.js'

export interface BuildMetadata {
  version: string
  branch: string
  commit: string
  prNumber: string | null
  author: string
  buildDate: string
  isTestnet: boolean
}

export interface ResolveBuildMetadataOptions {
  mode?: string
  target?: NetworkBuildTarget
  env?: Record<string, string | undefined>
  git?: (cmd: string) => string
  pkgVersion?: string
}

export const BUILD_INFO_MODULE_ID = 'virtual:adamant-build-info'
export const RESOLVED_BUILD_INFO_MODULE_ID = `\0${BUILD_INFO_MODULE_ID}`

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const COMMIT_RE = /^[0-9a-f]{7,40}$/i
const PR_RE = /^[1-9]\d{0,6}$/
const GITHUB_LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})(?:\[bot\])?$/
const DATE_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/

function sanitizeField(value: string | null | undefined, re: RegExp): string {
  if (!value) return ''
  const trimmed = value.trim()
  return re.test(trimmed) ? trimmed : ''
}

function sanitizeBranch(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length > 100) return ''
  if (trimmed.startsWith('/') || trimmed.endsWith('/')) return ''
  if (trimmed.includes('..') || trimmed.includes('//')) return ''
  if (!/^[A-Za-z0-9._/-]+$/.test(trimmed)) return ''
  const parts = trimmed.split('/')
  for (const part of parts) {
    if (!part || part.startsWith('.')) return ''
  }
  return trimmed
}

function runGit(command: string): string {
  try {
    return execSync(command, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      timeout: 3000
    }).trim()
  } catch {
    return ''
  }
}

function resolvePackageVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '../../package.json')
    const pkgContent = readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(pkgContent) as { version?: string }

    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

interface ParsedGithubEvent {
  prNumber?: string
  headSha?: string
  headRef?: string
  authorLogin?: string
}

function parseGithubEvent(eventPath?: string): ParsedGithubEvent {
  if (!eventPath) return {}
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- eventPath originates from GITHUB_EVENT_PATH
    const eventContent = readFileSync(eventPath, 'utf8')
    const data = JSON.parse(eventContent) as {
      pull_request?: {
        number?: number
        head?: { sha?: string; ref?: string }
        user?: { login?: string }
      }
      head_commit?: {
        id?: string
        author?: { username?: string }
      }
      number?: number
    }

    const pr = data.pull_request
    const prNumber = pr?.number ?? data.number
    const headSha = pr?.head?.sha ?? data.head_commit?.id
    const headRef = pr?.head?.ref
    const authorLogin = pr?.user?.login ?? data.head_commit?.author?.username

    return {
      prNumber: typeof prNumber === 'number' ? String(prNumber) : undefined,
      headSha: typeof headSha === 'string' ? headSha : undefined,
      headRef: typeof headRef === 'string' ? headRef : undefined,
      authorLogin: typeof authorLogin === 'string' ? authorLogin : undefined
    }
  } catch {
    return {}
  }
}

function resolveBranch(
  env: Record<string, string | undefined>,
  git: (cmd: string) => string,
  event: ParsedGithubEvent
): string {
  const candidate =
    env.BUILD_BRANCH ||
    event.headRef ||
    env.VERCEL_GIT_COMMIT_REF ||
    env.GITHUB_HEAD_REF ||
    env.GITHUB_REF_NAME ||
    env.GIT_BRANCH ||
    env.BRANCH

  if (candidate) {
    const normalized = candidate.replace(/^refs\/heads\//, '').trim()
    const sanitized = sanitizeBranch(normalized)
    if (sanitized) return sanitized
  }

  const gitBranch = git('git rev-parse --abbrev-ref HEAD')
  if (gitBranch && gitBranch !== 'HEAD') {
    const normalized = gitBranch.replace(/^refs\/heads\//, '').trim()
    const sanitized = sanitizeBranch(normalized)
    if (sanitized) return sanitized
  }

  const nameRev = git('git name-rev --name-only HEAD')
  if (nameRev && nameRev !== 'undefined') {
    const normalized = nameRev
      .replace(/^remotes\/origin\//, '')
      .replace(/^tags\//, '')
      .trim()
    const sanitized = sanitizeBranch(normalized)
    if (sanitized) return sanitized
  }

  return ''
}

function resolveCommit(
  env: Record<string, string | undefined>,
  git: (cmd: string) => string,
  event: ParsedGithubEvent
): string {
  const candidate = event.headSha || env.BUILD_COMMIT || env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA

  if (candidate) {
    const sanitized = sanitizeField(candidate.trim(), COMMIT_RE)
    if (sanitized) return sanitized.slice(0, 7)
  }

  const gitCommit = git('git rev-parse --short=7 HEAD')
  const sanitized = sanitizeField(gitCommit, COMMIT_RE)
  return sanitized ? sanitized.slice(0, 7) : ''
}

function resolvePrNumber(
  env: Record<string, string | undefined>,
  event: ParsedGithubEvent
): string | null {
  const candidate =
    env.PR_NUMBER ||
    env.VITE_PR_NUMBER ||
    env.GITHUB_PR_NUMBER ||
    env.VERCEL_GIT_PULL_REQUEST_ID ||
    event.prNumber

  if (candidate) {
    const sanitized = sanitizeField(candidate, PR_RE)
    if (sanitized) return sanitized
  }

  const githubRef = env.GITHUB_REF
  if (githubRef) {
    const match = githubRef.match(/^refs\/pull\/(\d+)\//)
    if (match) {
      const sanitized = sanitizeField(match[1], PR_RE)
      if (sanitized) return sanitized
    }
  }

  return null
}

function resolveAuthor(
  env: Record<string, string | undefined>,
  git: (cmd: string) => string,
  event: ParsedGithubEvent
): string {
  const candidate =
    env.BUILD_AUTHOR || event.authorLogin || env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || env.GITHUB_ACTOR

  if (candidate) {
    const sanitized = sanitizeField(candidate, GITHUB_LOGIN_RE)
    if (sanitized) return sanitized
  }

  const commitEmail = git('git log -1 --format=%ae')
  const noreplyMatch = commitEmail.match(/^([^@]+)@users\.noreply\.github\.com$/)
  if (noreplyMatch) {
    let login = noreplyMatch[1]
    const plusIndex = login.indexOf('+')
    if (plusIndex !== -1 && /^\d+$/.test(login.slice(0, plusIndex))) {
      login = login.slice(plusIndex + 1)
    }
    const sanitized = sanitizeField(login, GITHUB_LOGIN_RE)
    if (sanitized) return sanitized
  }

  const githubUser = git('git config github.user')
  if (githubUser) {
    const sanitized = sanitizeField(githubUser, GITHUB_LOGIN_RE)
    if (sanitized) return sanitized
  }

  const commitAuthor = git('git log -1 --format=%an')
  if (commitAuthor) {
    const sanitized = sanitizeField(commitAuthor, GITHUB_LOGIN_RE)
    if (sanitized) return sanitized
  }

  return ''
}

function resolveBuildDate(env: Record<string, string | undefined>): string {
  if (env.BUILD_DATE) {
    const sanitized = sanitizeField(env.BUILD_DATE, DATE_RE)
    if (sanitized) return sanitized
  }

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hours = String(now.getUTCHours()).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function resolveIsTestnet(mode?: string, target: NetworkBuildTarget = 'pwa'): boolean {
  try {
    return resolveNetworkConfigVariant(target, mode || 'production') === 'testnet'
  } catch {
    return mode === 'testnet'
  }
}

export function resolveBuildMetadata(
  optionsOrMode?: string | ResolveBuildMetadataOptions
): BuildMetadata {
  const options: ResolveBuildMetadataOptions =
    typeof optionsOrMode === 'string' ? { mode: optionsOrMode } : (optionsOrMode ?? {})

  const env = options.env ?? process.env
  const git = options.git ?? runGit
  const pkgVersion = options.pkgVersion ?? resolvePackageVersion()
  const event = parseGithubEvent(env.GITHUB_EVENT_PATH)

  return {
    version: pkgVersion,
    branch: resolveBranch(env, git, event),
    commit: resolveCommit(env, git, event),
    prNumber: resolvePrNumber(env, event),
    author: resolveAuthor(env, git, event),
    buildDate: resolveBuildDate(env),
    isTestnet: resolveIsTestnet(options.mode, options.target)
  }
}

export function buildInfoPlugin(options?: { target?: NetworkBuildTarget }): Plugin {
  let mode: string | undefined

  return {
    name: 'adamant-build-info-plugin',

    configResolved(config) {
      mode = config.mode
    },

    resolveId(id) {
      if (id === BUILD_INFO_MODULE_ID) {
        return RESOLVED_BUILD_INFO_MODULE_ID
      }

      return null
    },

    load(id) {
      if (id !== RESOLVED_BUILD_INFO_MODULE_ID) {
        return null
      }

      const metadata = resolveBuildMetadata({
        mode,
        target: options?.target
      })

      return `export default ${JSON.stringify(metadata, null, 2)}`
    }
  }
}
