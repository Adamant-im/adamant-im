import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { DogeClient } from './DogeClient'

const endpoints = (config.doge.nodes as NodeInfo[]).map((endpoint) => endpoint.url)
export const doge = new DogeClient(endpoints, config.adm.minNodeVersion)

export default doge
