import * as admApi from './adamant-api'
import store from '@/store'
import { Cryptos, isErc20 } from './constants'
import { vueBus } from '@/main'
import { uniqueCaseInsensitiveArray } from '@/lib/textHelpers'

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
  if (!admApi.isReady() || store.state.adm.addressesValidated || store.getters.isAccountNew()) return

  function skip (crypto) {
    return isErc20(crypto) || crypto === 'ADM'
  }

  Object.keys(Cryptos).forEach(crypto => {
    if (skip(crypto)) return
    let address = store.state[crypto.toLowerCase()].address
    if (address) {
      if (!store.state.adm.validatedCryptos[crypto]) {
        const key = `${crypto.toLowerCase()}:address`
        admApi.getStored(key, store.state.address, 20).then(txs => {
          if (txs.length > 0) {
            let validateInfo = parseCryptoAddressesKVStxs(txs)
            validateInfo.isMainAddressValid = validateInfo.mainAddress.toLowerCase() === address.toLowerCase()
            store.state.adm.validatedCryptos[crypto] = validateInfo
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
    if (!store.state.adm.validatedCryptos[crypto]) {
      isAllValidated = false
      break
    }

    if (!store.state.adm.validatedCryptos[crypto].isMainAddressValid) {
      validateSummary.isAllRight = false
      validateSummary.isWrongAddress = true
      validateSummary.wrongCoin = crypto
      validateSummary.wrongCoins.push(crypto)
      validateSummary.correctAddress = store.state[crypto.toLowerCase()].address
      validateSummary.storedAddress = store.state.adm.validatedCryptos[crypto].mainAddress
    }

    if (store.state.adm.validatedCryptos[crypto].addressesCount > 1) {
      validateSummary.isAllRight = false
      validateSummary.isManyAddresses = true
      validateSummary.manyAddressesCoin = crypto
      validateSummary.manyAddressesCoins.push(crypto)
      validateSummary.manyAddresses = store.state.adm.validatedCryptos[crypto].storedAddresses
    }
  }

  if (isAllValidated) {
    store.state.adm.validatedCryptos['summary'] = validateSummary
    store.state.adm.addressesValidated = true
    if (!store.state.options.suppressWarningOnAddressesNotification) {
      vueBus.$emit('warningOnAddressDialog', validateSummary)
    }
  }
}
