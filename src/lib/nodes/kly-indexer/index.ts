import config from '@/config'
import { Service } from '@/types/wallets'
import { KlyIndexerClient } from './KlyIndexerClient'

const endpoints = (config.kly.services.list.klyService as Service[]).map((endpoint) => endpoint.url)
export const klyIndexer = new KlyIndexerClient(endpoints)

export default klyIndexer
