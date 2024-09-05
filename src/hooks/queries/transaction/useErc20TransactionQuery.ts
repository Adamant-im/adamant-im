import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { CryptoSymbol } from '@/lib/constants'
import { Erc20Transaction } from '@/lib/nodes/types/transaction'
import { PendingTransaction, PendingTxStore } from '@/lib/pending-transactions'
import { refetchIntervalFactory, refetchOnMountFn, retryDelayFactory, retryFactory } from './utils'
import { UseTransactionQueryParams } from './types'

export function useErc20TransactionQuery(crypto: CryptoSymbol) {
  return (transactionId: MaybeRef<string>, params: UseTransactionQueryParams = {}) => {
    const store = useStore()

    return useQuery<Erc20Transaction | PendingTransaction>({
      queryKey: ['transaction', crypto, transactionId],
      queryFn: () => eth.getErc20Transaction(unref(transactionId), store.state.eth.address, crypto),
      initialData: () => {
        const pendingTransaction = PendingTxStore.get(crypto)
        if (pendingTransaction?.id === unref(transactionId)) {
          return pendingTransaction
        }
      },
      retry: retryFactory(crypto, unref(transactionId)),
      retryDelay: retryDelayFactory(crypto, unref(transactionId)),
      refetchInterval: ({ state }) => refetchIntervalFactory(crypto, state.status, state.data),
      refetchOnWindowFocus: false,
      refetchOnMount: params?.refetchOnMount ?? (({ state }) => refetchOnMountFn(state.data)),
      enabled: params.enabled
    })
  }
}
