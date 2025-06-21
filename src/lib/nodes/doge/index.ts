import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { DogeClient } from './DogeClient'

const endpoints = config.doge.nodes.list as NodeInfo[]

export const doge = new DogeClient(endpoints)

export default doge
