import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const requestPermission = vi.fn()
  class Notify {
    static requestPermission = requestPermission
    show = vi.fn()
  }

  return {
    Notify,
    hidden: vi.fn(() => false),
    isAdamantChat: vi.fn(() => true),
    joinUrl: vi.fn(() => '/sound/bbpro_link.mp3')
  }
})

vi.mock('notifyjs', () => ({ default: mocks.Notify }))
vi.mock('visibilityjs', () => ({ default: { hidden: mocks.hidden } }))
vi.mock('@/filters/currencyAmountWithSymbol', () => ({ default: vi.fn(() => '1 ADM') }))
vi.mock('@/lib/markdown', () => ({ formatMessageBasic: (message: string) => message }))
vi.mock('@/lib/chat/meta/utils', () => ({ isAdamantChat: mocks.isAdamantChat }))
vi.mock('@/lib/urlFormatter.js', () => ({ joinUrl: mocks.joinUrl }))

import Notifications from './notifications'

beforeEach(() => {
  class AudioMock {
    play = vi.fn()
  }

  vi.stubGlobal('Audio', AudioMock)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('Notifications translator binding', () => {
  it('uses the injected $t when $i18n does not expose t', () => {
    const t = vi.fn((key: string) => `translated:${key}`)
    const store = {
      getters: {
        'chat/lastUnreadMessage': {
          id: 'message-id',
          senderId: 'U1234567890',
          type: 'message',
          message: 'Hello',
          asset: {}
        },
        'partners/displayName': () => 'app_title',
        'chat/totalNumOfNewMessages': 1
      },
      state: {
        options: {
          allowPushNotifications: false,
          allowSoundNotifications: false,
          allowTabNotifications: false,
          formatMessages: true
        }
      }
    }

    const notifications = new Notifications({
      $t: t,
      $i18n: { global: {} },
      $router: { push: vi.fn() },
      $route: { name: 'Home' },
      $store: store
    })

    expect(notifications.partnerIdentity).toBe('translated:app_title')
    expect(t).toHaveBeenCalledWith('app_title')
  })
})
