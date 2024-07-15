import { useQuery } from '@tanstack/vue-query'
import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

import { DecodedChatMessageTransaction, decodeTransaction } from '@/lib/adamant-api'
import * as admApi from '@/lib/adamant-api'
import { Cryptos } from '@/lib/constants'

const fetchTransaction = async (transactionId: string, currentUserAdmAddress: string) => {
  const rawTransaction = await admApi.getTransaction(transactionId, 1)
  if (!rawTransaction) throw new Error('Transaction not found')

  const transaction = decodeTransaction(rawTransaction, currentUserAdmAddress)

  return {
    ...transaction,
    amount: transaction.amount / 1e8,
    fee: transaction.fee / 1e8
  }
}

export function useAdmTransferQuery(transactionId: MaybeRef<string>) {
  const store = useStore()

  return useQuery({
    queryKey: ['transaction', Cryptos.ADM, transactionId],
    queryFn: () => fetchTransaction(unref(transactionId), store.state.address),
    initialData: {} as DecodedChatMessageTransaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC)
  })
}
