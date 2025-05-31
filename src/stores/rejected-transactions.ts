import { defineStore } from 'pinia'
import { Ref, ref } from 'vue'
import { type TransactionStatusType } from '@/lib/constants'

export const useFinalTransactions = defineStore(
  'final-transactions',
  () => {
    const list: Ref<Record<string, TransactionStatusType>> = ref({})
    const addTransaction = (id: string, status: TransactionStatusType) => {
      list.value[id] = status
    }

    const removeTransaction = (id: string) => {
      delete list.value[id]
    }

    return {
      list,

      addTransaction,
      removeTransaction
    }
  },
  {
    persist: {
      storage: sessionStorage
    }
  }
)
