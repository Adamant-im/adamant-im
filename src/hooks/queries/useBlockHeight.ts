import { computed, MaybeRef, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getTxFetchInfo } from '@/lib/transactionsFetching'
import { adm, btcIndexer, dash, dogeIndexer, eth, kly } from '@/lib/nodes'

type Chain = 'ADM' | 'BTC' | 'DOGE' | 'DASH' | 'ETH' | 'KLY'

const fetchBlockHeight = async (chain: Chain): Promise<number> => {
  switch (chain) {
    case 'ADM':
      return adm.getHeight()
    case 'BTC':
      return btcIndexer.getHeight()
    case 'DOGE':
      return dogeIndexer.getHeight()
    case 'DASH':
      return dash.getHeight()
    case 'ETH':
      return eth.getHeight()
    case 'KLY':
      return kly.getHeight()
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

type UseBlockHeightOptions = {
  enabled?: MaybeRef<boolean> | (() => boolean)
}

/**
 * Returns the current block height of the target blockchain.
 */
export function useBlockHeight(chain: MaybeRef<Chain>, options: UseBlockHeightOptions = {}) {
  const { newPendingInterval } = getTxFetchInfo(chain)

  const { data: blockHeight } = useQuery({
    queryKey: ['blockHeight', chain],
    queryFn: () => fetchBlockHeight(unref(chain)),
    refetchInterval: newPendingInterval,
    enabled: options.enabled
  })

  return computed(() => blockHeight.value || 0)
}
