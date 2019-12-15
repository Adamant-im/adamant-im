import coininfo from 'coininfo'
import { Cryptos } from '../constants'

export default Object.freeze({
  [Cryptos.DOGE]: coininfo.dogecoin.main.toBitcoinJS(),
  [Cryptos.DASH]: coininfo.dash.main.toBitcoinJS(),
  [Cryptos.BTC]: coininfo.bitcoin.main.toBitcoinJS()
})
