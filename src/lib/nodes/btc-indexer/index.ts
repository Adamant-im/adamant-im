import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { BtcIndexerClient } from './BtcIndexerClient'

const endpoints = config.btc.services.btcIndexer.list as NodeInfo[]

export const btcIndexer = new BtcIndexerClient(endpoints)

export default btcIndexer
