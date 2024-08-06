import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { DogeIndexerClient } from './DogeIndexerClient'

const endpoints = (config.doge.nodes.list as NodeInfo[]).map((endpoint) => endpoint.url)
export const dogeIndexer = new DogeIndexerClient(endpoints)

export default dogeIndexer
