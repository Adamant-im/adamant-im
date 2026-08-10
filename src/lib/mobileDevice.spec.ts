import { afterEach, describe, expect, it } from 'vitest'

import { isMobileDevice, isNarrowMobileViewport } from './mobileDevice'

const userAgentDataDescriptor = Object.getOwnPropertyDescriptor(navigator, 'userAgentData')
const userAgentDescriptor = Object.getOwnPropertyDescriptor(navigator, 'userAgent')
const innerWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth')

function setNavigatorValue(key: 'userAgentData' | 'userAgent', value: unknown) {
  Object.defineProperty(navigator, key, {
    configurable: true,
    value
  })
}

describe('mobile device detection', () => {
  afterEach(() => {
    if (userAgentDataDescriptor) {
      Object.defineProperty(navigator, 'userAgentData', userAgentDataDescriptor)
    } else {
      Reflect.deleteProperty(navigator, 'userAgentData')
    }

    if (userAgentDescriptor) {
      Object.defineProperty(navigator, 'userAgent', userAgentDescriptor)
    }

    if (innerWidthDescriptor) {
      Object.defineProperty(window, 'innerWidth', innerWidthDescriptor)
    }
  })

  it('prefers the structured user-agent mobile flag', () => {
    setNavigatorValue('userAgentData', { mobile: true })
    setNavigatorValue('userAgent', 'Desktop browser')

    expect(isMobileDevice()).toBe(true)
  })

  it('preserves the mobile layout for Android tablets', () => {
    setNavigatorValue('userAgentData', { mobile: false })
    setNavigatorValue('userAgent', 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet)')

    expect(isMobileDevice()).toBe(true)
  })

  it('keeps desktop devices on the desktop path when the structured flag is false', () => {
    setNavigatorValue('userAgentData', { mobile: false })
    setNavigatorValue('userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)')

    expect(isMobileDevice()).toBe(false)
  })

  it.each(['Android', 'iPhone', 'iPad', 'BlackBerry'])('recognizes %s user agents', (device) => {
    Reflect.deleteProperty(navigator, 'userAgentData')
    setNavigatorValue('userAgent', `Mozilla/5.0 (${device})`)

    expect(isMobileDevice()).toBe(true)
  })

  it('keeps desktop user agents on the desktop path', () => {
    Reflect.deleteProperty(navigator, 'userAgentData')
    setNavigatorValue('userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)')

    expect(isMobileDevice()).toBe(false)
  })

  it('uses the existing narrow viewport threshold', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 449 })
    expect(isNarrowMobileViewport()).toBe(true)

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 450 })
    expect(isNarrowMobileViewport()).toBe(false)
  })
})
