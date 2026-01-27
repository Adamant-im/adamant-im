import coininfo from 'coininfo'
import { Cryptos } from '../constants'

const nets = {
  [Cryptos.DOGE]: coininfo.dogecoin.main.toBitcoinJS(),
  [Cryptos.DASH]: coininfo.dash.main.toBitcoinJS(),
  [Cryptos.BTC]: coininfo.bitcoin.main.toBitcoinJS()
}

// fix lack of bech32 value as new validation rules of ecpair dependency require string value in this key
Object.values(nets).forEach((net) => {
  net.bech32 ??= ''
})

export default Object.freeze(nets)
