import { lskIndexer } from './lsk-indexer'
import { ethIndexer } from './eth-indexer'
import { rateInfoClient } from './rate-info-service'

export const services = {
  lskIndexer,
  ethIndexer,
  rate: rateInfoClient
}
