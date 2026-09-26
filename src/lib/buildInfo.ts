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
 * Line 2: "{commit}" (or "{prNumber} {commit}", "dev {commit}", or "" for master)
 */
export function getBuildInfoLines(info: BuildMetadata): BuildInfoLines {
  const line1 = `v${info.version}`
  let line2: string

  if (info.prNumber) {
    line2 = [info.prNumber, info.commit || 'unknown'].join(' ')
  } else if (info.branch === 'dev') {
    line2 = ['dev', info.commit || 'unknown'].join(' ')
  } else if (info.branch === 'master' && info.commit) {
    line2 = ''
  } else {
    // plain branch without PR, or unknown branch
    line2 = info.commit || 'unknown'
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
  const { line1, line2 } = getBuildInfoLines(info)
  return [line1, line2].filter(Boolean).join(' ')
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
  return `${GITHUB_REPO_URL}/pull/${encodeURIComponent(String(prNumber))}`
}

/**
 * Force-updates the app: clears the CacheStorage, unregisters service workers,
 * and hard-reloads the page so the browser fetches the latest build.
 * Note: Keeps user credentials and local state (IndexedDB, localStorage, sessionStorage) intact.
 */
export async function forceAppUpdate(): Promise<'reloaded' | 'offline'> {
  // If offline, preserve precache and service worker registration
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    return 'offline'
  }

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

  try {
    if (typeof window !== 'undefined' && window.location) {
      await fetch(window.location.href, { cache: 'reload', credentials: 'same-origin' })
    }
  } catch {
    // Offline or network error: proceed to plain reload below
  }

  if (typeof window !== 'undefined' && window.location) {
    window.location.reload()
  }

  return 'reloaded'
}
