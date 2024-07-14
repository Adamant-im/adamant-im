import { NODE_LABELS } from '@/lib/nodes/constants.ts'

export type ServicesState = {
  [NODE_LABELS.RatesInfo]: Record<string, { active: boolean }>
  useFastestService: true
}

export type AvailableService = 'rates-info'
