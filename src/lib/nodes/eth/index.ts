import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { EthClient } from './EthClient'

const endpoints = (config.eth.nodes.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const eth = new EthClient(endpoints)

export default eth
