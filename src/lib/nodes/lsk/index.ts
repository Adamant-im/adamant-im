import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { LskClient } from './LskClient'

const endpoints = (config.lsk.nodes as NodeInfo[]).map((endpoint) => endpoint.url)
export const lsk = new LskClient(endpoints)

export default lsk
