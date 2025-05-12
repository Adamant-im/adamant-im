import config from '@/config'
import { RateInfoClient } from '@/lib/nodes/rate-info-service/RateInfoClient'
import type { NodeInfo } from '@/types/wallets'

const endpoints = config.adm.services.infoService.list as NodeInfo[]

export const rateInfoClient = new RateInfoClient(endpoints)

export default rateInfoClient
