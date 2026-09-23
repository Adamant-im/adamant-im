import buildInfoFromModule from 'virtual:adamant-build-info'
import { logger } from '@/utils/devTools/logger'

export interface BuildMetadata {
  version: string
  branch: string
  commit: string
  prNumber: string | null
  author: string
  buildDate: string
  isTestnet: boolean
}

export const buildInfo: BuildMetadata = buildInfoFromModule

export const GITHUB_REPO_URL = 'https://github.com/Adamant-im/adamant-im'

export interface BuildInfoLines {
  line1: string
  line2: string
}

/**
 * Returns two-line build identity string:
 * Line 1: "v{version}"
 * Line 2: "{commit}" (or "{prNumber} {commit}", "dev {commit}")
 */
export function getBuildInfoLines(info: BuildMetadata): BuildInfoLines {
  const line1 = `v${info.version}`
  let line2: string

  if (info.prNumber) {
    line2 = [info.prNumber, info.commit].filter(Boolean).join(' ')
  } else if (info.branch === 'dev') {
    line2 = ['dev', info.commit].filter(Boolean).join(' ')
  } else {
    // master or plain branch without PR
    line2 = info.commit || ''
  }

  return { line1, line2 }
}

/**
 * Returns the compact version string according to build source rules:
 * - master: "v4.8.1"
 * - dev: "v4.8.1 dev 60e87c6"
 * - branch with a PR: "v4.8.1 712 60e87c6"
 * - plain branch without PR: "v4.8.1 60e87c6"
 */
export function getCompactBuildInfoString(info: BuildMetadata): string {
  const versionPrefix = `v${info.version}`
  const commit = info.commit || ''

  // 1. Branch with PR and a build
  if (info.prNumber) {
    return [versionPrefix, info.prNumber, commit].filter(Boolean).join(' ')
  }

  // 2. Master branch build (only version needed because every change comes with version bump)
  if (info.branch === 'master') {
    return versionPrefix
  }

  // 3. Dev branch build
  if (info.branch === 'dev') {
    return [versionPrefix, 'dev', commit].filter(Boolean).join(' ')
  }

  // 4. Plain branch without a PR or a build
  return [versionPrefix, commit].filter(Boolean).join(' ')
}

export function getBranchUrl(branch: string): string {
  if (!branch) return GITHUB_REPO_URL
  return `${GITHUB_REPO_URL}/tree/${encodeURIComponent(branch)}`
}

export function getCommitUrl(commit: string): string {
  if (!commit) return GITHUB_REPO_URL
  return `${GITHUB_REPO_URL}/commit/${encodeURIComponent(commit)}`
}

export function getAuthorUrl(author: string): string {
  if (!author) return GITHUB_REPO_URL
  return `https://github.com/${encodeURIComponent(author)}`
}

export function getPrUrl(prNumber: string | number): string {
  if (!prNumber) return GITHUB_REPO_URL
  return `${GITHUB_REPO_URL}/pull/${prNumber}`
}

/**
 * Force-updates the app: clears the CacheStorage, unregisters service workers,
 * and hard-reloads the page so the browser fetches the latest build.
 * Note: Keeps user credentials and local state (IndexedDB, localStorage, sessionStorage) intact.
 */
export async function forceAppUpdate(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && 'caches' in window && window.caches) {
      const keys = await window.caches.keys()
      await Promise.all(keys.map((key) => window.caches.delete(key)))
    }
  } catch (error) {
    logger.warn('forceAppUpdate', 'Failed to clear cache storage', error)
  }

  try {
    if (
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      navigator.serviceWorker
    ) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }
  } catch (error) {
    logger.warn('forceAppUpdate', 'Failed to unregister service workers', error)
  }

  if (typeof window !== 'undefined' && window.location) {
    window.location.reload()
  }
}
