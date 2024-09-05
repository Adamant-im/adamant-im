import { klyIndexer } from './kly-indexer'
import { ethIndexer } from './eth-indexer'
import { rateInfoClient } from './rate-info-service'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { dogeIndexer } from './doge-indexer'
import { btcIndexer } from './btc-indexer'

export const services = {
  [NODE_LABELS.KlyIndexer]: klyIndexer,
  [NODE_LABELS.EthIndexer]: ethIndexer,
  [NODE_LABELS.BtcIndexer]: btcIndexer,
  [NODE_LABELS.DogeIndexer]: dogeIndexer,
  [NODE_LABELS.RatesInfo]: rateInfoClient
}
