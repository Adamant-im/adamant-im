import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { IpfsClient } from './IpfsClient'

const endpoints = (config.adm.services.ipfsNode.list as NodeInfo[]).map((endpoint) => ({
  alt_ip: endpoint.alt_ip,
  url: endpoint.url
}))
export const ipfs = new IpfsClient(endpoints, config.adm.services.minVersion)

export default ipfs
