import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { DashClient } from './DashClient'

const endpoints = (config.dash.nodes.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const dash = new DashClient(endpoints)

export default dash
