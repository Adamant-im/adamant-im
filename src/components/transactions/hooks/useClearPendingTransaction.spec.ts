import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { useClearPendingTransaction } from './useClearPendingTransaction'

const pendingTxStoreMock = vi.hoisted(() => ({
  get: vi.fn(),
  remove: vi.fn()
}))

vi.mock('@/lib/pending-transactions', () => ({
  PendingTxStore: pendingTxStoreMock
}))

const createStoreMock = () => {
  return createStore({
    modules: {
      btc: {
        namespaced: true,
        actions: {
          getNewTransactions: vi.fn()
        }
      }
    }
  })
}

describe('useClearPendingTransaction', () => {
  it('refreshes BTC transactions when a pending transaction becomes registered', async () => {
    pendingTxStoreMock.get.mockReturnValue({ id: 'tx-1' })

    const store = createStoreMock()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    const transaction = ref({
      id: 'tx-1',
      status: 'PENDING'
    })
    const status = ref('PENDING')

    const TestComponent = defineComponent({
      setup() {
        useClearPendingTransaction('BTC', transaction as any, status as any)
        return () => h('div')
      }
    })

    mount(TestComponent, {
      global: {
        plugins: [store]
      }
    })

    status.value = 'REGISTERED'
    await nextTick()

    expect(dispatchSpy).toHaveBeenCalledWith('btc/getNewTransactions')
    expect(pendingTxStoreMock.remove).not.toHaveBeenCalled()
  })

  it('removes pending transaction and refreshes BTC list when status becomes rejected', async () => {
    pendingTxStoreMock.get.mockReturnValue({ id: 'tx-1' })

    const store = createStoreMock()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    const transaction = ref({
      id: 'tx-1',
      status: 'PENDING'
    })
    const status = ref('PENDING')

    const TestComponent = defineComponent({
      setup() {
        useClearPendingTransaction('BTC', transaction as any, status as any)
        return () => h('div')
      }
    })

    mount(TestComponent, {
      global: {
        plugins: [store]
      }
    })

    status.value = 'REJECTED'
    await nextTick()

    expect(pendingTxStoreMock.remove).toHaveBeenCalledWith('BTC')
    expect(dispatchSpy).toHaveBeenCalledWith('btc/getNewTransactions')
  })
})
