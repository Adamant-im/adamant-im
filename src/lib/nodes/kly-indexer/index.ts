import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { KlyIndexerClient } from './KlyIndexerClient'

const endpoints = config.kly.services.klyService.list as NodeInfo[]

export const klyIndexer = new KlyIndexerClient(endpoints)

export default klyIndexer
