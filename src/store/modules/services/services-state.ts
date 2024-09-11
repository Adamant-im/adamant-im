import { ServicesState } from '@/store/modules/services/types'
import { NODE_LABELS } from '@/lib/nodes/constants'

export const state: ServicesState = {
  [NODE_LABELS.RatesInfo]: {},
  [NODE_LABELS.BtcIndexer]: {},
  [NODE_LABELS.DogeIndexer]: {},
  [NODE_LABELS.EthIndexer]: {},
  [NODE_LABELS.KlyIndexer]: {},
  useFastestService: true
}
