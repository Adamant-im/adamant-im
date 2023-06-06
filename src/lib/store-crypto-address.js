import * as admApi from './adamant-api'
import store from '@/store'
import { Cryptos, isErc20, RE_LSK_ADDRESS_LEGACY } from './constants'
import { vueBus } from '@/lib/vueBus'
import { uniqueCaseInsensitiveArray, isStringEqualCI } from '@/lib/textHelpers'

let queue = { }
let stored = []

// Clear this on logout to store new values after re-login
export function resetKVSAddresses () {
  queue = { }
  stored = []
}

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
export function parseCryptoAddressesKVStxs (txs, crypto) {
  if (!txs || !txs.length || !txs[0].asset || !txs[0].asset.state || !txs[0].asset) return null
  const addresses = { }
  // validateInfo.storedAddresses = [...new Set(txs.map(tx => tx.asset.state.value))]
  addresses.storedAddresses = uniqueCaseInsensitiveArray(txs.map(tx => tx.asset.state.value))
  // Lisk has updated their address format, and both may be stored
  // Remove legacy addresses
  if (crypto === Cryptos.LSK) {
    addresses.storedAddresses = addresses.storedAddresses.filter(address => !RE_LSK_ADDRESS_LEGACY.test(address))
    if (addresses.storedAddresses.length === 0) {
      addresses.onlyLegacyLiskAddress = true
    }
  }
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
    const address = store.state[crypto.toLowerCase()].address
    if (address) {
      if (!store.state.adm.validatedCryptos[crypto]) {
        const key = `${crypto.toLowerCase()}:address`
        admApi.getStored(key, store.state.address, 20).then(txs => {
          // It may be empty array: no addresses stored yet for this crypto
          if (txs) {
            let validateInfo = parseCryptoAddressesKVStxs(txs, crypto)
            if (validateInfo && !validateInfo.onlyLegacyLiskAddress) {
              // Some address(es) is stored
              validateInfo.isSomeAddressStored = true
              validateInfo.isMainAddressValid = isStringEqualCI(validateInfo.mainAddress, address)
            } else {
              // No addresses stored yet for this crypto
              validateInfo = {
                isSomeAddressStored: false
              }
            }
            store.state.adm.validatedCryptos[crypto] = validateInfo
          }
        })
      }
    }
  })

  let isAllValidated = true
  const validateSummary = { }
  validateSummary.isAllRight = true
  validateSummary.wrongCoins = []
  validateSummary.manyAddressesCoins = []

  for (const crypto of Object.keys(Cryptos)) {
    if (skip(crypto)) continue
    if (!store.state.adm.validatedCryptos[crypto]) {
      isAllValidated = false
      break
    }
    if (!validateSummary.isSomeAddressStored) continue

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
    store.state.adm.validatedCryptos.summary = validateSummary
    store.state.adm.addressesValidated = true
    if (!store.state.options.suppressWarningOnAddressesNotification) {
      vueBus.emit('warningOnAddressDialog', validateSummary)
    }
  }
}
