import * as admApi from './adamant-api'

const queue = { }
const stored = []

export function storeCryptoAddress (crypto, address) {
  if (!queue[crypto] && !stored.includes(crypto)) {
    queue[crypto] = address
  }
}

export function flushCryptoAddresses () {
  if (!admApi.isReady()) return

  Object.keys(queue).forEach(crypto => {
    const address = queue[crypto]
    admApi.storeCryptoAddress(crypto, address).then(success => {
      if (success) {
        delete queue[crypto]
        stored.push(crypto)
      }
    })
  })
}
