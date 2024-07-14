import { ServicesState } from '@/store/modules/services/types'
import { NODE_LABELS } from '@/lib/nodes/constants'

export const state: ServicesState = {
  [NODE_LABELS.RatesInfo]: {},
  useFastestService: true
}
