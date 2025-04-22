import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { DogeIndexerClient } from './DogeIndexerClient'

const endpoints = (config.doge.nodes.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const dogeIndexer = new DogeIndexerClient(endpoints)

export default dogeIndexer
