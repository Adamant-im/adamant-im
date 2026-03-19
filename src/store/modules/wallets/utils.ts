import { AllCryptosOrder, CryptosInfo, CryptoSymbol } from '@/lib/constants/cryptos'
import { CoinSymbol, WalletsState } from '@/store/modules/wallets/types'

export function mapWallets(): CoinSymbol[] {
  return AllCryptosOrder.map((crypto: CryptoSymbol) => {
    const isVisible = !!CryptosInfo[crypto].defaultVisibility
    const symbol = CryptosInfo[crypto].symbol as CryptoSymbol

    return {
      isVisible,
      symbol
    }
  })
}

export function normalizeWalletsState(state: WalletsState | null | undefined): WalletsState {
  const defaultSymbols = mapWallets()
  const defaultWalletsBySymbol = new Map(
    defaultSymbols.map((wallet) => [wallet.symbol, wallet] as const)
  )

  if (!state?.symbols || !Array.isArray(state.symbols)) {
    return {
      symbols: defaultSymbols
    }
  }

  const symbols = state.symbols.reduce<CoinSymbol[]>((normalized, wallet) => {
    const symbol = typeof wallet?.symbol === 'string' ? (wallet.symbol as CryptoSymbol) : null

    if (!symbol || normalized.some((item) => item.symbol === symbol)) {
      return normalized
    }

    const defaultWallet = defaultWalletsBySymbol.get(symbol)

    if (!defaultWallet) {
      return normalized
    }

    normalized.push({
      symbol,
      isVisible: typeof wallet.isVisible === 'boolean' ? wallet.isVisible : defaultWallet.isVisible
    })

    return normalized
  }, [])

  defaultSymbols.forEach((wallet) => {
    if (!symbols.some((item) => item.symbol === wallet.symbol)) {
      symbols.push(wallet)
    }
  })

  return { symbols }
}
