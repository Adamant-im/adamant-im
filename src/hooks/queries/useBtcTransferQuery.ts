import { MaybeRef, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { btc } from '@/lib/nodes'
import { BtcTransaction } from '@/lib/nodes/types/transaction'
/**
 * @param transactionId - BTC transaction ID
 * @param address - BTC address
 */
export function useBtcTransferQuery(transactionId: MaybeRef<string>, address: MaybeRef<string>) {
  return useQuery({
    queryKey: ['transaction', Cryptos.BTC, transactionId],
    queryFn: () => btc.getTransaction(unref(transactionId), unref(address)),
    initialData: {} as BtcTransaction
  })
}
