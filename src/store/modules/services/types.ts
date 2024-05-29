export type ServicesState = {
  rate: Record<string, { active: boolean }>
  useFastestService: true
}

export type AvailableService = 'rate'
