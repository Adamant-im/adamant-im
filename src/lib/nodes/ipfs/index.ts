import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { IpfsClient } from './IpfsClient.ts'

const endpoints = (config.adm.services.list.ipfs as NodeInfo[]).map((endpoint) => endpoint.url)
export const ipfs = new IpfsClient(endpoints)

export default ipfs
