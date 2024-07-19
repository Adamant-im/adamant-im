import { PendingTxStore } from '@/lib/pending-transactions'
import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { eth } from '@/lib/nodes'
import { CryptoSymbol } from '@/lib/constants'
import { Erc20Transaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

export function useErc20TransactionQuery(crypto: CryptoSymbol) {
  return (transactionId: MaybeRef<string>) => {
    const store = useStore()

    return useQuery({
      queryKey: ['transaction', crypto, transactionId],
      queryFn: () => eth.getErc20Transaction(unref(transactionId), store.state.eth.address, crypto),
      initialData: () => {
        const pendingTransaction = PendingTxStore.get(crypto)
        if (pendingTransaction?.id === transactionId) return pendingTransaction

        return {} as Erc20Transaction
      },
      retry: retryFactory(crypto, unref(transactionId)),
      retryDelay: retryDelayFactory(crypto, unref(transactionId)),
      refetchInterval: ({ state }) =>
        refetchIntervalFactory(crypto, state.status, state.data?.status),
      refetchOnWindowFocus: false
    })
  }
}
