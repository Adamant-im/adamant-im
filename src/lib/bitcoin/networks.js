import coininfo from 'coininfo'
import { Cryptos } from '../constants'

const nets = {
  [Cryptos.DOGE]: coininfo.dogecoin.main.toBitcoinJS(),
  [Cryptos.DASH]: coininfo.dash.main.toBitcoinJS(),
  [Cryptos.BTC]: coininfo.bitcoin.main.toBitcoinJS()
}

// ECPair v3 validates network shape and expects `bech32` to be a string key.
// DOGE and DASH network objects do not define bech32 (no native segwit/bech32 usage),
// so we provide an empty string to satisfy validation without changing address behavior.
Object.values(nets).forEach((net) => {
  net.bech32 ??= ''
})

export default Object.freeze(nets)
