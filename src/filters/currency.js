import BigNumber from '@/lib/bignumber'
import { Cryptos } from '@/lib/constants'

export default (amount, crypto = Cryptos.ADM) => {
  const formatted = BigNumber(
    crypto === Cryptos.ADM ? amount / 1e8 : amount
  ).toFixed()
  return `${formatted} ${crypto}`
}
