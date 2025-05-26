import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { EthIndexerClient } from './EthIndexerClient'

const endpoints = config.eth.services.ethIndexer.list as NodeInfo[]

export const ethIndexer = new EthIndexerClient(endpoints)

export default ethIndexer
