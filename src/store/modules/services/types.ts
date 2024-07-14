import { NODE_LABELS } from '@/lib/nodes/constants'

export type ServicesState = {
  [NODE_LABELS.RatesInfo]: Record<string, { active: boolean }>
  useFastestService: true
}

export type AvailableService = 'rates-info'
