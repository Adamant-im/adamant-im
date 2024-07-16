import { NODE_LABELS } from '@/lib/nodes/constants'

export type ServicesState = {
  [NODE_LABELS.RatesInfo]: Record<string, { active: boolean }>
  useFastestService: boolean
}

export type AvailableService = 'rates-info'

export type StatusPayload = {
  serviceType: AvailableService
  status: { url: string; active: boolean }
}
export type TogglePayload = { type: AvailableService; url: string; active: boolean }

export type ServicesGetters = {
  rate: (state: ServicesState) => { active: boolean }[]
}
