import { CryptoSymbol } from '@/lib/constants'

export type CoinSymbol = {
  isVisible: boolean
  symbol: CryptoSymbol
}

export interface WalletsState {
  symbols: CoinSymbol[]
}
