import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

export interface BuildMetadata {
  version: string
  branch: string
  commit: string
  prNumber: string | null
  author: string
  buildDate: string
  isTestnet: boolean
}

export const BUILD_INFO_MODULE_ID = 'virtual:adamant-build-info'
export const RESOLVED_BUILD_INFO_MODULE_ID = `\0${BUILD_INFO_MODULE_ID}`

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

function resolveBranch(): string {
  const envBranch =
    process.env.BUILD_BRANCH ||
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    process.env.GIT_BRANCH ||
    process.env.BRANCH

  if (envBranch) {
    return envBranch.replace(/^refs\/heads\//, '').trim()
  }

  const gitBranch = runGit('git rev-parse --abbrev-ref HEAD')

  if (gitBranch && gitBranch !== 'HEAD') {
    return gitBranch.replace(/^refs\/heads\//, '').trim()
  }

  const nameRev = runGit('git name-rev --name-only HEAD')

  if (nameRev && nameRev !== 'undefined') {
    return nameRev
      .replace(/^remotes\/origin\//, '')
      .replace(/^tags\//, '')
      .trim()
  }

  return 'master'
}

function resolveCommit(): string {
  const envCommit = process.env.BUILD_COMMIT || process.env.GITHUB_SHA

  if (envCommit) {
    return envCommit.slice(0, 7)
  }

  const gitCommit = runGit('git rev-parse --short=7 HEAD')

  return gitCommit || ''
}

function resolvePrNumber(): string | null {
  const envPr = process.env.PR_NUMBER || process.env.VITE_PR_NUMBER || process.env.GITHUB_PR_NUMBER

  if (envPr) {
    return envPr.trim()
  }

  const githubRef = process.env.GITHUB_REF

  if (githubRef) {
    const match = githubRef.match(/^refs\/pull\/(\d+)\//)

    if (match) {
      return match[1]
    }
  }

  const eventPath = process.env.GITHUB_EVENT_PATH

  if (eventPath) {
    try {
      const eventContent = readFileSync(eventPath, 'utf8')
      const eventData = JSON.parse(eventContent) as {
        pull_request?: { number?: number }
        number?: number
      }
      const prNumber = eventData.pull_request?.number ?? eventData.number

      if (typeof prNumber === 'number') {
        return String(prNumber)
      }
    } catch {
      // Ignore invalid event JSON
    }
  }

  return null
}

function resolveAuthor(): string {
  const envAuthor = process.env.BUILD_AUTHOR || process.env.GITHUB_ACTOR

  if (envAuthor) {
    return envAuthor.trim()
  }

  const commitEmail = runGit('git log -1 --format=%ae')
  const noreplyMatch = commitEmail.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/)

  if (noreplyMatch) {
    return noreplyMatch[1]
  }

  const commitAuthor = runGit('git log -1 --format=%an')

  return commitAuthor || 'Adamant-im'
}

function resolveBuildDate(): string {
  if (process.env.BUILD_DATE) {
    return process.env.BUILD_DATE.trim()
  }

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hours = String(now.getUTCHours()).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function resolveIsTestnet(mode?: string): boolean {
  return (
    mode === 'testnet' ||
    process.env.VITE_NETWORK === 'testnet' ||
    Boolean(process.env.npm_lifecycle_event?.includes('testnet'))
  )
}

export function resolveBuildMetadata(mode?: string): BuildMetadata {
  return {
    version: resolvePackageVersion(),
    branch: resolveBranch(),
    commit: resolveCommit(),
    prNumber: resolvePrNumber(),
    author: resolveAuthor(),
    buildDate: resolveBuildDate(),
    isTestnet: resolveIsTestnet(mode)
  }
}

export function buildInfoPlugin(): Plugin {
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

      const metadata = resolveBuildMetadata(mode)

      return `export default ${JSON.stringify(metadata, null, 2)}`
    }
  }
}
