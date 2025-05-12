import config from '@/config'
import type { NodeInfo } from '@/types/wallets'
import { AdmClient } from './AdmClient'

const endpoints = config.adm.nodes.list as NodeInfo[]

export const adm = new AdmClient(endpoints, config.adm.nodes.minVersion)

export default adm
