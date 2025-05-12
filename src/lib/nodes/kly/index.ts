import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { KlyClient } from './KlyClient'

const endpoints = config.kly.nodes.list as NodeInfo[]

export const kly = new KlyClient(endpoints)

export default kly
