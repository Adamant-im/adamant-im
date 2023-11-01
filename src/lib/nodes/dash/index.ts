import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { DashClient } from './DashClient'

const endpoints = (config.dash.nodes as NodeInfo[]).map((endpoint) => endpoint.url)
export const dash = new DashClient(endpoints, config.adm.minNodeVersion)

export default dash
