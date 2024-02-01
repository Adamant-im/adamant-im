import config from '@/config'
import { Service } from '@/types/wallets'
import { LskIndexerClient } from './LskIndexerClient'

const endpoints = (config.lsk.services.list.lskService as Service[]).map((endpoint) => endpoint.url)
export const lskIndexer = new LskIndexerClient(endpoints)

export default lskIndexer
