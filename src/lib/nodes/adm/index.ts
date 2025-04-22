import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { AdmClient } from './AdmClient'

const endpoints = (config.adm.nodes.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const adm = new AdmClient(endpoints, config.adm.nodes.minVersion)

export default adm
