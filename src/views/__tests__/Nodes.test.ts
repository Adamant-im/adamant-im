import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Nodes from '@/views/Nodes.vue'

const { dispatchMock, updateHealthcheckIntervalMock } = vi.hoisted(() => ({
  dispatchMock: vi.fn(),
  updateHealthcheckIntervalMock: vi.fn()
}))

vi.mock('vuex', () => ({
  useStore: () => ({
    dispatch: dispatchMock
  })
}))

vi.mock('@/lib/nodes', () => ({
  nodesManager: {
    updateHealthcheckInterval: updateHealthcheckIntervalMock
  }
}))

describe('Nodes view healthcheck interval', () => {
  beforeEach(() => {
    dispatchMock.mockReset()
    updateHealthcheckIntervalMock.mockReset()
  })

  it('switches to onScreen interval on mount and restores normal on unmount', () => {
    const wrapper = mount(Nodes, {
      global: {
        stubs: {
          NodesTable: true
        }
      }
    })

    expect(dispatchMock).toHaveBeenCalledWith('nodes/updateStatus')
    expect(updateHealthcheckIntervalMock).toHaveBeenCalledWith('onScreen')

    wrapper.unmount()

    expect(updateHealthcheckIntervalMock).toHaveBeenCalledWith('normal')
    expect(updateHealthcheckIntervalMock.mock.calls.map(([value]) => value)).toEqual([
      'onScreen',
      'normal'
    ])
  })
})
