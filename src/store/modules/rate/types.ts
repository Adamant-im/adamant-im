export type Rates = Record<string, number>
export type RateState = {
  rates: Rates
  isLoaded: boolean
  historyRates: Record<number, Rates>
}
