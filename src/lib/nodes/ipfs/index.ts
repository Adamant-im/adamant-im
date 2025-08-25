import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { IpfsClient } from './IpfsClient'

const endpoints = config.adm.services.ipfsNode.list as NodeInfo[]

export const ipfs = new IpfsClient(endpoints, config.adm.services.minVersion)

export default ipfs
