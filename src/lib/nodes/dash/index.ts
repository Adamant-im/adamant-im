import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { DashClient } from './DashClient'

const endpoints = config.dash.nodes.list as NodeInfo[]

export const dash = new DashClient(endpoints)

export default dash
