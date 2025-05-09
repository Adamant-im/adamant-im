import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { KlyIndexerClient } from './KlyIndexerClient'

const endpoints = (config.kly.services.klyService.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const klyIndexer = new KlyIndexerClient(endpoints)

export default klyIndexer
