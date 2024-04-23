import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { IpfsClient } from './IpfsClient.ts'

const endpoints = (config.ipfs.nodes.list as NodeInfo[]).map((endpoint) => endpoint.url)
export const ipfs = new IpfsClient(endpoints, config.ipfs.nodes.minVersion)

export default ipfs
