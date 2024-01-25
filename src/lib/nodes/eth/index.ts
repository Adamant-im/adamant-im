import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { EthClient } from './EthClient'

const endpoints = (config.eth.nodes.list as NodeInfo[]).map((endpoint) => endpoint.url)
export const eth = new EthClient(endpoints)

export default eth
