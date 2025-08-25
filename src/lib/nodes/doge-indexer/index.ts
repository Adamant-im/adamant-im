import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { DogeIndexerClient } from './DogeIndexerClient'

const endpoints = config.doge.nodes.list as NodeInfo[]

export const dogeIndexer = new DogeIndexerClient(endpoints)

export default dogeIndexer
