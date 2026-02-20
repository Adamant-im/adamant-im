import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount, VueWrapper } from '@vue/test-utils'
import { useHealthcheckResume } from './useHealthcheckResume'

const { dispatchMock } = vi.hoisted(() => ({
  dispatchMock: vi.fn()
}))

vi.mock('vuex', () => ({
  useStore: () => ({
    dispatch: dispatchMock
  })
}))

const visibilityStateDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState')

const TestHost = defineComponent({
  name: 'UseHealthcheckResumeHost',
  setup() {
    useHealthcheckResume()

    return {}
  },
  template: '<div />'
})

function setVisibilityState(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: state
  })
}

function getActionCalls(action: string) {
  return dispatchMock.mock.calls.filter(([name]) => name === action).length
}

describe('useHealthcheckResume', () => {
  let wrapper: VueWrapper<any> | null = null

  beforeEach(() => {
    dispatchMock.mockReset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    setVisibilityState('visible')
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()

    if (visibilityStateDescriptor) {
      Object.defineProperty(document, 'visibilityState', visibilityStateDescriptor)
    } else {
      Reflect.deleteProperty(document, 'visibilityState')
    }
  })

  it('refreshes node/service statuses on mount', () => {
    wrapper = mount(TestHost)

    expect(getActionCalls('nodes/updateStatus')).toBe(1)
    expect(getActionCalls('services/updateStatus')).toBe(1)
  })

  it('debounces burst of resume triggers and allows refresh after debounce window', () => {
    wrapper = mount(TestHost)
    dispatchMock.mockClear()

    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('online'))
    document.dispatchEvent(new Event('resume'))

    expect(dispatchMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1_501)
    window.dispatchEvent(new Event('focus'))

    expect(getActionCalls('nodes/updateStatus')).toBe(1)
    expect(getActionCalls('services/updateStatus')).toBe(1)
  })

  it('reacts to visibility change only when tab becomes visible', () => {
    wrapper = mount(TestHost)
    dispatchMock.mockClear()

    setVisibilityState('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(dispatchMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1_501)
    setVisibilityState('visible')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(getActionCalls('nodes/updateStatus')).toBe(1)
    expect(getActionCalls('services/updateStatus')).toBe(1)
  })

  it('resumes on pageshow when page is restored from bfcache', () => {
    wrapper = mount(TestHost)
    dispatchMock.mockClear()

    setVisibilityState('hidden')
    vi.advanceTimersByTime(1_501)

    const pageShowEvent = new Event('pageshow')
    Object.defineProperty(pageShowEvent, 'persisted', { value: true })
    window.dispatchEvent(pageShowEvent)

    expect(getActionCalls('nodes/updateStatus')).toBe(1)
    expect(getActionCalls('services/updateStatus')).toBe(1)
  })

  it('detects long sleep gap via heartbeat and resumes when visible', () => {
    wrapper = mount(TestHost)
    vi.advanceTimersByTime(5_000)
    dispatchMock.mockClear()

    vi.setSystemTime(new Date(Date.now() + 25_000))
    vi.advanceTimersByTime(5_000)

    expect(getActionCalls('nodes/updateStatus')).toBe(1)
    expect(getActionCalls('services/updateStatus')).toBe(1)
  })

  it('does not auto-resume on heartbeat sleep gap while tab is hidden', () => {
    wrapper = mount(TestHost)
    vi.advanceTimersByTime(5_000)
    dispatchMock.mockClear()

    setVisibilityState('hidden')
    vi.setSystemTime(new Date(Date.now() + 25_000))
    vi.advanceTimersByTime(5_000)

    expect(dispatchMock).not.toHaveBeenCalled()
  })

  it('removes listeners and heartbeat timer on unmount', () => {
    wrapper = mount(TestHost)
    dispatchMock.mockClear()

    wrapper.unmount()
    wrapper = null

    vi.setSystemTime(new Date(Date.now() + 25_000))
    vi.advanceTimersByTime(30_000)
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('online'))
    document.dispatchEvent(new Event('resume'))
    document.dispatchEvent(new Event('visibilitychange'))

    expect(dispatchMock).not.toHaveBeenCalled()
  })
})
