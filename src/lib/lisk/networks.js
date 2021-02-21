import coininfo from 'coininfo'
import { Cryptos } from '../constants'

export default Object.freeze({
  [Cryptos.LSK]: coininfo.bitcoin.main.toBitcoinJS()
})
