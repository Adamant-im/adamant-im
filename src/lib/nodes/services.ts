import { klyIndexer } from './kly-indexer'
import { ethIndexer } from './eth-indexer'
import { rateInfoClient } from './rate-info-service'

export const services = {
  klyIndexer,
  ethIndexer,
  rate: rateInfoClient
}
