import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { EthIndexerClient } from './EthIndexerClient'

const endpoints = (config.eth.services.ethIndexer.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const ethIndexer = new EthIndexerClient(endpoints)

export default ethIndexer
