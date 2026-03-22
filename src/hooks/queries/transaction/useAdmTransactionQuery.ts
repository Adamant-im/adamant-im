import { useQuery } from '@tanstack/vue-query'
import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { refetchIntervalFactory, refetchOnMountFn, retryDelayFactory, retryFactory } from './utils'

import { DecodedChatMessageTransaction, decodeTransaction } from '@/lib/adamant-api'
import * as admApi from '@/lib/adamant-api'
import { Cryptos, TransactionStatusType } from '@/lib/constants'
import { UseTransactionQueryParams } from './types'

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

export function useAdmTransactionQuery(
  transactionId: MaybeRef<string>,
  params: UseTransactionQueryParams = {}
) {
  const store = useStore()
  const toTransactionStatusShape = (
    transaction?: DecodedChatMessageTransaction
  ): { status?: TransactionStatusType; timestamp?: number } | undefined => transaction

  return useQuery({
    queryKey: ['transaction', Cryptos.ADM, transactionId],
    queryFn: () => fetchTransaction(unref(transactionId), store.state.address),
    initialData: {} as DecodedChatMessageTransaction,
    retry: retryFactory(Cryptos.ADM, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.ADM, unref(transactionId)),
    refetchInterval: ({ state }) =>
      refetchIntervalFactory(Cryptos.ADM, state.status, toTransactionStatusShape(state.data)),
    refetchOnWindowFocus: false,
    refetchOnMount:
      params?.refetchOnMount ??
      (({ state }) => refetchOnMountFn(toTransactionStatusShape(state.data))),
    enabled: params.enabled
  })
}
