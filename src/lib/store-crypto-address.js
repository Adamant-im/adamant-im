import * as admApi from './adamant-api'
import store from '@/store'
import { Cryptos, isErc20 } from './constants'
import { vueBus } from '@/main'
import { uniqueCaseInsensitiveArray } from '@/lib/textHelpers'

const queue = { }
const stored = []
export const validatedCryptos = { }

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

/**
 * Parses KVS transactions for crypto addresses
 * @returns object for stored addresses
 */
export function parseCryptoAddressesKVStxs (txs) {
  if (!txs || !txs.length || !txs[0].asset || !txs[0].asset.state || !txs[0].asset) return null
  let addresses = { }
  // validateInfo.storedAddresses = [...new Set(txs.map(tx => tx.asset.state.value))]
  addresses.storedAddresses = uniqueCaseInsensitiveArray(txs.map(tx => tx.asset.state.value))
  addresses.addressesCount = addresses.storedAddresses.length
  addresses.mainAddress = addresses.storedAddresses[0]
  return addresses
}

/**
 * Validates if crypto addresses, stored in KVS are consistent; emits warningOnAddressDialog if they're not consistent
 * @returns nothing
 */
export function validateStoredCryptoAddresses () {
  if (!admApi.isReady() || validatedCryptos['summary'] || store.getters.isAccountNew()) return

  function skip (crypto) {
    return isErc20(crypto) || crypto === 'ADM'
  }

  Object.keys(Cryptos).forEach(crypto => {
    if (skip(crypto)) return
    let address = store.state[crypto.toLowerCase()].address
    if (address) {
      if (!validatedCryptos[crypto]) {
        const key = `${crypto.toLowerCase()}:address`
        admApi.getStored(key, store.state.address, 20).then(txs => {
          if (txs.length > 0) {
            let validateInfo = parseCryptoAddressesKVStxs(txs)
            validateInfo.isMainAddressValid = validateInfo.mainAddress.toLowerCase() === address.toLowerCase()
            console.log('validateInfo', validateInfo)
            validatedCryptos[crypto] = validateInfo
          }
        })
      }
    }
  })

  let isAllValidated = true
  let validateSummary = { }
  validateSummary.isAllRight = true
  validateSummary.wrongCoins = []
  validateSummary.manyAddressesCoins = []

  for (const crypto of Object.keys(Cryptos)) {
    if (skip(crypto)) continue
    if (!validatedCryptos[crypto]) {
      isAllValidated = false
      break
    }

    if (!validatedCryptos[crypto].isMainAddressValid) {
      validateSummary.isAllRight = false
      validateSummary.isWrongAddress = true
      validateSummary.wrongCoin = crypto
      validateSummary.wrongCoins.push(crypto)
      validateSummary.correctAddress = store.state[crypto.toLowerCase()].address
      validateSummary.storedAddress = validatedCryptos[crypto].mainAddress
    }

    if (validatedCryptos[crypto].addressesCount > 1) {
      validateSummary.isAllRight = false
      validateSummary.isManyAddresses = true
      validateSummary.manyAddressesCoin = crypto
      validateSummary.manyAddressesCoins.push(crypto)
      validateSummary.manyAddresses = validatedCryptos[crypto].storedAddresses
    }
  }

  if (isAllValidated) {
    validatedCryptos['summary'] = validateSummary
    console.log('validateSummary', validateSummary)
    vueBus.$emit('warningOnAddressDialog', validateSummary)
  }
}
