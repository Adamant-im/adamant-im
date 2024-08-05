export type RateHistoryInfoResponse = {
  success: boolean
  date: number
  result: {
    _id: string
    date: number
    tickers: Record<string, number>
  }[]
}
