import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  getCompactBuildInfoString,
  getBuildInfoLines,
  getBranchUrl,
  getCommitUrl,
  getAuthorUrl,
  getPrUrl,
  forceAppUpdate,
  GITHUB_REPO_URL
} from '@/lib/buildInfo'
import { resolveBuildMetadata } from '../../../vite-config/plugins/buildInfoPlugin'

describe('buildInfo helper', () => {
  describe('getBuildInfoLines', () => {
    it('formats master branch as version on line 1 and empty string on line 2 when commit is present', () => {
      const result = getBuildInfoLines({
        version: '4.12.0',
        branch: 'master',
        commit: 'f61f9e0',
        prNumber: null,
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result.line1).toBe('v4.12.0')
      expect(result.line2).toBe('')
    })

    it('formats master branch without commit as unknown on line 2', () => {
      const result = getBuildInfoLines({
        version: '4.12.0',
        branch: 'master',
        commit: '',
        prNumber: null,
        author: '',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result.line1).toBe('v4.12.0')
      expect(result.line2).toBe('unknown')
    })

    it('formats unknown build identity as unknown on line 2', () => {
      const result = getBuildInfoLines({
        version: '4.12.0',
        branch: '',
        commit: '',
        prNumber: null,
        author: '',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result.line1).toBe('v4.12.0')
      expect(result.line2).toBe('unknown')
    })

    it('formats dev branch as dev and commit on line 2', () => {
      const result = getBuildInfoLines({
        version: '4.12.0',
        branch: 'dev',
        commit: '60e87c6',
        prNumber: null,
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result.line1).toBe('v4.12.0')
      expect(result.line2).toBe('dev 60e87c6')
    })

    it('formats dev branch without commit as dev unknown on line 2', () => {
      const result = getBuildInfoLines({
        version: '4.12.0',
        branch: 'dev',
        commit: '',
        prNumber: null,
        author: '',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result.line1).toBe('v4.12.0')
      expect(result.line2).toBe('dev unknown')
    })

    it('formats PR branch as prNumber and commit on line 2', () => {
      const result = getBuildInfoLines({
        version: '4.12.0',
        branch: 'feature/pr-test',
        commit: '60e87c6',
        prNumber: '712',
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result.line1).toBe('v4.12.0')
      expect(result.line2).toBe('712 60e87c6')
    })

    it('formats PR branch without commit as prNumber unknown on line 2', () => {
      const result = getBuildInfoLines({
        version: '4.12.0',
        branch: 'feature/pr-test',
        commit: '',
        prNumber: '712',
        author: '',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result.line1).toBe('v4.12.0')
      expect(result.line2).toBe('712 unknown')
    })

    it('formats plain branch as commit on line 2', () => {
      const result = getBuildInfoLines({
        version: '4.12.0',
        branch: 'feature/plain',
        commit: '60e87c6',
        prNumber: null,
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result.line1).toBe('v4.12.0')
      expect(result.line2).toBe('60e87c6')
    })
  })

  describe('getCompactBuildInfoString', () => {
    it('formats master branch as only version', () => {
      const result = getCompactBuildInfoString({
        version: '4.8.1',
        branch: 'master',
        commit: '60e87c6',
        prNumber: null,
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result).toBe('v4.8.1')
    })

    it('formats unknown build identity as version and unknown', () => {
      const result = getCompactBuildInfoString({
        version: '4.8.1',
        branch: '',
        commit: '',
        prNumber: null,
        author: '',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result).toBe('v4.8.1 unknown')
    })

    it('formats master branch without commit as version and unknown', () => {
      const result = getCompactBuildInfoString({
        version: '4.8.1',
        branch: 'master',
        commit: '',
        prNumber: null,
        author: '',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result).toBe('v4.8.1 unknown')
    })

    it('formats dev branch as version, dev, and commit', () => {
      const result = getCompactBuildInfoString({
        version: '4.8.1',
        branch: 'dev',
        commit: '60e87c6',
        prNumber: null,
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result).toBe('v4.8.1 dev 60e87c6')
    })

    it('formats branch with a PR and a build with PR number and commit', () => {
      const result = getCompactBuildInfoString({
        version: '4.8.1',
        branch: 'feature/new-login',
        commit: '60e87c6',
        prNumber: '712',
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result).toBe('v4.8.1 712 60e87c6')
    })

    it('formats plain branch without PR as version and commit', () => {
      const result = getCompactBuildInfoString({
        version: '4.8.1',
        branch: 'feature/local-branch',
        commit: '60e87c6',
        prNumber: null,
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result).toBe('v4.8.1 60e87c6')
    })

    it('handles missing commit gracefully', () => {
      const result = getCompactBuildInfoString({
        version: '4.8.1',
        branch: 'dev',
        commit: '',
        prNumber: null,
        author: 'bludnic',
        buildDate: '2025-02-25 13:44',
        isTestnet: false
      })

      expect(result).toBe('v4.8.1 dev unknown')
    })
  })

  describe('GitHub URL generators', () => {
    it('generates branch URL', () => {
      expect(getBranchUrl('master')).toBe(`${GITHUB_REPO_URL}/tree/master`)
      expect(getBranchUrl('feature/branch')).toBe(`${GITHUB_REPO_URL}/tree/feature%2Fbranch`)
      expect(getBranchUrl('')).toBe(GITHUB_REPO_URL)
    })

    it('generates commit URL', () => {
      expect(getCommitUrl('60e87c6')).toBe(`${GITHUB_REPO_URL}/commit/60e87c6`)
      expect(getCommitUrl('')).toBe(GITHUB_REPO_URL)
    })

    it('generates author URL', () => {
      expect(getAuthorUrl('bludnic')).toBe('https://github.com/bludnic')
      expect(getAuthorUrl('')).toBe(GITHUB_REPO_URL)
    })

    it('generates PR URL', () => {
      expect(getPrUrl('712')).toBe(`${GITHUB_REPO_URL}/pull/712`)
      expect(getPrUrl(712)).toBe(`${GITHUB_REPO_URL}/pull/712`)
      expect(getPrUrl('')).toBe(GITHUB_REPO_URL)
    })
  })

  describe('forceAppUpdate', () => {
    const originalCaches = window.caches
    const originalLocation = window.location
    const originalServiceWorker = window.navigator.serviceWorker
    const originalFetch = global.fetch

    beforeEach(() => {
      // Mock location.reload and href
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          reload: vi.fn(),
          href: 'http://localhost/'
        }
      })

      // Default online
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        writable: true,
        value: true
      })

      global.fetch = vi.fn().mockResolvedValue(new Response())
    })

    afterEach(() => {
      Object.defineProperty(window, 'caches', { writable: true, value: originalCaches })
      Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        writable: true,
        value: originalServiceWorker
      })
      global.fetch = originalFetch
    })

    it('clears caches, unregisters service workers, fetches with reload cache, and reloads window', async () => {
      const mockDelete = vi.fn().mockResolvedValue(true)
      const mockKeys = vi.fn().mockResolvedValue(['cache-v1', 'cache-v2'])

      Object.defineProperty(window, 'caches', {
        writable: true,
        value: {
          keys: mockKeys,
          delete: mockDelete
        }
      })

      const mockUnregister = vi.fn().mockResolvedValue(true)
      const mockGetRegistrations = vi
        .fn()
        .mockResolvedValue([{ unregister: mockUnregister }, { unregister: mockUnregister }])

      Object.defineProperty(window.navigator, 'serviceWorker', {
        writable: true,
        value: {
          getRegistrations: mockGetRegistrations
        }
      })

      const result = await forceAppUpdate()

      expect(result).toBe('reloaded')
      expect(global.fetch).toHaveBeenCalledWith('http://localhost/', {
        cache: 'reload',
        credentials: 'same-origin'
      })
      expect(mockKeys).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalledWith('cache-v1')
      expect(mockDelete).toHaveBeenCalledWith('cache-v2')
      expect(mockGetRegistrations).toHaveBeenCalled()
      expect(mockUnregister).toHaveBeenCalledTimes(2)
      expect(window.location.reload).toHaveBeenCalled()
    })

    it('does not wipe caches or reload when navigator is offline', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        writable: true,
        value: false
      })

      const mockKeys = vi.fn()
      Object.defineProperty(window, 'caches', {
        writable: true,
        value: { keys: mockKeys }
      })

      const result = await forceAppUpdate()

      expect(result).toBe('offline')
      expect(mockKeys).not.toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
      expect(window.location.reload).not.toHaveBeenCalled()
    })

    it('tolerates environments without caches or serviceWorker', async () => {
      Object.defineProperty(window, 'caches', { writable: true, value: undefined })
      Object.defineProperty(window.navigator, 'serviceWorker', { writable: true, value: undefined })

      const result = await forceAppUpdate()

      expect(result).toBe('reloaded')
      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  describe('resolveBuildMetadata', () => {
    it('resolves master push metadata without PR number', () => {
      const meta = resolveBuildMetadata({
        env: { GITHUB_REF_NAME: 'master', GITHUB_SHA: 'f61f9e0123456789', GITHUB_ACTOR: 'octocat' },
        git: () => '',
        pkgVersion: '4.12.0'
      })

      expect(meta.version).toBe('4.12.0')
      expect(meta.branch).toBe('master')
      expect(meta.commit).toBe('f61f9e0')
      expect(meta.author).toBe('octocat')
      expect(meta.prNumber).toBeNull()
      expect(meta.isTestnet).toBe(false)
    })

    it('resolves dev push metadata', () => {
      const meta = resolveBuildMetadata({
        env: { GITHUB_REF_NAME: 'dev', GITHUB_SHA: '60e87c6123456789', GITHUB_ACTOR: 'octocat' },
        git: () => '',
        pkgVersion: '4.12.0'
      })

      expect(meta.branch).toBe('dev')
      expect(meta.commit).toBe('60e87c6')
      expect(meta.author).toBe('octocat')
      expect(meta.prNumber).toBeNull()
    })

    it('resolves PR preview metadata with head SHA from GITHUB_EVENT_PATH', () => {
      const tmpDir = os.tmpdir()
      const eventPath = path.join(tmpDir, `gh-event-${Date.now()}.json`)
      fs.writeFileSync(
        eventPath,
        JSON.stringify({
          pull_request: {
            number: 712,
            head: {
              sha: 'abcdef1234567890',
              ref: 'feature/pr-preview'
            },
            user: {
              login: 'pr-author'
            }
          }
        })
      )

      try {
        const meta = resolveBuildMetadata({
          env: {
            GITHUB_EVENT_PATH: eventPath,
            GITHUB_SHA: 'synthetic-merge-sha-that-should-be-ignored'
          },
          git: () => '',
          pkgVersion: '4.12.0'
        })

        expect(meta.prNumber).toBe('712')
        expect(meta.commit).toBe('abcdef1')
        expect(meta.branch).toBe('feature/pr-preview')
        expect(meta.author).toBe('pr-author')
      } finally {
        fs.unlinkSync(eventPath)
      }
    })

    it('resolves Vercel preview metadata', () => {
      const meta = resolveBuildMetadata({
        env: {
          VERCEL_GIT_COMMIT_REF: 'feature/vercel-test',
          VERCEL_GIT_COMMIT_SHA: '9876543210abcdef',
          VERCEL_GIT_PULL_REQUEST_ID: '820',
          VERCEL_GIT_COMMIT_AUTHOR_LOGIN: 'vercel-dev'
        },
        git: () => '',
        pkgVersion: '4.12.0'
      })

      expect(meta.branch).toBe('feature/vercel-test')
      expect(meta.commit).toBe('9876543')
      expect(meta.prNumber).toBe('820')
      expect(meta.author).toBe('vercel-dev')
    })

    it('returns empty strings when no git or CI variables are present', () => {
      const meta = resolveBuildMetadata({
        env: {},
        git: () => '',
        pkgVersion: '4.12.0'
      })

      expect(meta.branch).toBe('')
      expect(meta.commit).toBe('')
      expect(meta.author).toBe('')
      expect(meta.prNumber).toBeNull()
    })

    it('sanitizes hostile or invalid inputs and prevents injection', () => {
      const meta = resolveBuildMetadata({
        env: {
          BUILD_BRANCH: '../../../etc/passwd',
          BUILD_COMMIT: 'invalid_sha!',
          PR_NUMBER: '123; rm -rf /',
          BUILD_AUTHOR: 'Bad Actor <actor@evil.com>',
          BUILD_DATE: 'yesterday'
        },
        git: () => '',
        pkgVersion: '4.12.0'
      })

      expect(meta.branch).toBe('')
      expect(meta.commit).toBe('')
      expect(meta.prNumber).toBeNull()
      expect(meta.author).toBe('')
      expect(meta.buildDate).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })

    it('prioritizes explicit BUILD_COMMIT over github event headSha', () => {
      const meta = resolveBuildMetadata({
        env: {
          BUILD_COMMIT: 'bbbbbbb999999'
        },
        event: {
          headSha: 'aaaaaaa111111'
        },
        git: () => '',
        pkgVersion: '4.12.0'
      })

      expect(meta.commit).toBe('bbbbbbb')
    })

    it('resolves author from git config github.user, dropping %an fallback', () => {
      const metaWithGithubUser = resolveBuildMetadata({
        env: {},
        git: (cmd) => (cmd === 'git config github.user' ? 'octocat' : ''),
        pkgVersion: '4.12.0'
      })
      expect(metaWithGithubUser.author).toBe('octocat')

      // %an git log format is dropped to avoid attributing arbitrary display names to GitHub users
      const metaWithCommitAuthor = resolveBuildMetadata({
        env: {},
        git: (cmd) => (cmd === 'git log -1 --format=%an' ? 'octocat-dev' : ''),
        pkgVersion: '4.12.0'
      })
      expect(metaWithCommitAuthor.author).toBe('')
    })

    it('resolves isTestnet according to network config', () => {
      expect(resolveBuildMetadata({ mode: 'testnet' }).isTestnet).toBe(true)
      expect(resolveBuildMetadata({ mode: 'production' }).isTestnet).toBe(false)
    })
  })
})
