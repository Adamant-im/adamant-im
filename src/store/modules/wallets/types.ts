import { CryptoSymbol } from '@/lib/constants'

export type CoinSymbol = {
  isVisible: boolean
  symbol: CryptoSymbol
}
export interface PluginWalletsState {
  wallets: {
    symbols: CoinSymbol[]
  }
}

export interface WalletsState {
  symbols: CoinSymbol[]
}
