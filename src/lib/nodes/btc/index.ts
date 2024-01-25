import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { BtcClient } from './BtcClient'

const endpoints = (config.btc.nodes.list as NodeInfo[]).map((endpoint) => endpoint.url)
export const btc = new BtcClient(endpoints)

export default btc
