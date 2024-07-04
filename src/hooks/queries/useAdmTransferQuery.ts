import { useQuery } from '@tanstack/vue-query'
import { MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'

import { DecodedChatMessageTransaction, decodeTransaction } from '@/lib/adamant-api'
import * as admApi from '@/lib/adamant-api'
import { Cryptos } from '@/lib/constants'

const fetchTransaction = async (transactionId: string, currentUserAdmAddress: string) => {
  const rawTransaction = await admApi.getTransaction(transactionId, 1)
  if (!rawTransaction) throw new Error('Transaction not found')

  return decodeTransaction(rawTransaction, currentUserAdmAddress)
}

export function useAdmTransferQuery(transactionId: MaybeRef<string>) {
  const store = useStore()

  return useQuery({
    queryKey: ['transaction', Cryptos.ADM, transactionId],
    queryFn: () => fetchTransaction(unref(transactionId), store.state.address),
    initialData: {} as DecodedChatMessageTransaction
  })
}
