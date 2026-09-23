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
    it('formats master branch as version on line 1 and commit on line 2', () => {
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
      expect(result.line2).toBe('f61f9e0')
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

      expect(result).toBe('v4.8.1 dev')
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
    const originalNavigator = window.navigator
    const originalLocation = window.location

    beforeEach(() => {
      // Mock location.reload
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          reload: vi.fn(),
          href: 'http://localhost/'
        }
      })
    })

    afterEach(() => {
      Object.defineProperty(window, 'caches', { writable: true, value: originalCaches })
      Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
    })

    it('clears caches, unregisters service workers, and reloads window', async () => {
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

      await forceAppUpdate()

      expect(mockKeys).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalledWith('cache-v1')
      expect(mockDelete).toHaveBeenCalledWith('cache-v2')
      expect(mockGetRegistrations).toHaveBeenCalled()
      expect(mockUnregister).toHaveBeenCalledTimes(2)
      expect(window.location.reload).toHaveBeenCalled()
    })

    it('tolerates environments without caches or serviceWorker', async () => {
      Object.defineProperty(window, 'caches', { writable: true, value: undefined })
      Object.defineProperty(window.navigator, 'serviceWorker', { writable: true, value: undefined })

      await forceAppUpdate()

      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  describe('resolveBuildMetadata', () => {
    it('correctly resolves metadata without leaking sensitive machine info', () => {
      const metadata = resolveBuildMetadata('production')

      expect(metadata.version).toMatch(/^\d+\.\d+\.\d+/)
      expect(typeof metadata.branch).toBe('string')
      expect(typeof metadata.commit).toBe('string')
      expect(metadata.isTestnet).toBe(false)
      expect(metadata.buildDate).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)

      // Ensure no file system paths or tokens leaked
      const serialized = JSON.stringify(metadata)
      expect(serialized).not.toContain('/Users/')
      expect(serialized).not.toContain('/home/')
      expect(serialized).not.toContain('ghp_')
      expect(serialized).not.toContain('token')
    })

    it('detects testnet mode', () => {
      const metadata = resolveBuildMetadata('testnet')
      expect(metadata.isTestnet).toBe(true)
    })
  })
})
