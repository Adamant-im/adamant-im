import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { AdmClient } from './AdmClient'

const endpoints = (config.adm.nodes as NodeInfo[]).map((endpoint) => endpoint.url)
export const adm = new AdmClient(endpoints, config.adm.minNodeVersion)

export default adm
