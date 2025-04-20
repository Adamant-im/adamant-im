import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { KlyClient } from './KlyClient'

const endpoints = (config.kly.nodes.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const kly = new KlyClient(endpoints)

export default kly
