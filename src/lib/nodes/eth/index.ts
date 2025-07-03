import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { EthClient } from './EthClient'

const endpoints = config.eth.nodes.list as NodeInfo[]

export const eth = new EthClient(endpoints)

export default eth
