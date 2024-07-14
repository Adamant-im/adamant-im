import { klyIndexer } from './kly-indexer'
import { ethIndexer } from './eth-indexer'
import { rateInfoClient } from './rate-info-service'
import { NODE_LABELS } from '@/lib/nodes/constants.ts'

export const services = {
  klyIndexer,
  ethIndexer,
  [NODE_LABELS.RatesInfo]: rateInfoClient
}
