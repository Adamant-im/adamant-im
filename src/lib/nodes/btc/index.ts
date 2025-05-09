import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { BtcClient } from './BtcClient'

const endpoints = (config.btc.nodes.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const btc = new BtcClient(endpoints)

export default btc
