import { defineComponent, PropType, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { describe, expect, it, vi } from 'vitest'
import { TransactionStatus } from '@/lib/constants'
import {
  hasTransactionFinalStatusInSession,
  makeTransactionStatusSessionKey,
  rememberTransactionFinalStatus,
  resetTransactionStatusSessionCache,
  syncTransactionStatusSession
} from '@/providers/TransactionProvider/sessionFinalStatusCache'
import { useSyncChatTransferPendingStatus } from './useSyncChatTransferPendingStatus'

const queryStatus = ref<'pending' | 'success'>('success')
const isFetching = ref(false)

const HookHost = defineComponent({
  props: {
    transaction: {
      type: Object as PropType<Record<string, any> | undefined>,
      default: undefined
    }
  },
  setup(props) {
    useSyncChatTransferPendingStatus(
      'DOGE',
      'doge-hash',
      ref(props.transaction as any),
      isFetching,
      queryStatus as any
    )

    return () => null
  }
})

describe('useSyncChatTransferPendingStatus', () => {
  it('pushes a final chat transfer back to pending when details start a new status check', () => {
    resetTransactionStatusSessionCache()
    syncTransactionStatusSession('U111111')

    const store = createStore({
      state: {
        address: 'U111111'
      },
      modules: {
        chat: {
          namespaced: true,
          mutations: {
            updateCryptoTransferMessage() {}
          }
        }
      }
    })
    const commit = vi.spyOn(store, 'commit')

    rememberTransactionFinalStatus(
      makeTransactionStatusSessionKey('U111111', 'DOGE', 'doge-hash'),
      TransactionStatus.REJECTED
    )

    queryStatus.value = 'pending'
    isFetching.value = true

    mount(HookHost, {
      props: {
        transaction: {
          id: 'adm-msg-id',
          hash: 'doge-hash',
          type: 'DOGE',
          senderId: 'U111111',
          recipientId: 'U222222',
          status: TransactionStatus.REJECTED
        }
      },
      global: {
        plugins: [store]
      }
    })

    expect(commit).toHaveBeenCalledWith('chat/updateCryptoTransferMessage', {
      partnerId: 'U222222',
      hash: 'doge-hash',
      status: TransactionStatus.PENDING
    })
    expect(
      hasTransactionFinalStatusInSession(
        makeTransactionStatusSessionKey('U111111', 'DOGE', 'doge-hash'),
        TransactionStatus.REJECTED
      )
    ).toBe(false)
  })
})
