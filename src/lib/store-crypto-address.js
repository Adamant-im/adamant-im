import * as admApi from './adamant-api'
import store from '@/store'
import { Cryptos, isErc20 } from './constants'
import { vueBus } from '@/main'

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
 * Validates if crypto addresses, stored in KVS are correct
 * @returns undefined if check wasn't completed, object
 */
export function validateStoredCryptoAddresses () {
  if (!admApi.isReady() || validatedCryptos['summary']) return

  function skip (crypto) {
    return isErc20(crypto) || crypto === 'ADM'
  }

  function uniqueCaseInsensitive (values) {
    return [...new Map(values.map(s => [s.toLowerCase(), s])).values()]
  }

  Object.keys(Cryptos).forEach(crypto => {
    if (skip(crypto)) return
    let address = store.state[crypto.toLowerCase()].address
    if (address) {
      if (!validatedCryptos[crypto]) {
        const key = `${crypto.toLowerCase()}:address`
        admApi.getStored(key, store.state.address, 20).then(txs => {
          let validateInfo = { }
          validateInfo.txCount = txs.length
          // validateInfo.storedAddresses = [...new Set(txs.map(tx => tx.asset.state.value))]
          validateInfo.storedAddresses = uniqueCaseInsensitive(txs.map(tx => tx.asset.state.value))
          validateInfo.addressesCount = validateInfo.storedAddresses.length
          validateInfo.mainAddress = validateInfo.storedAddresses[0]
          validateInfo.isMainAddressValid = validateInfo.mainAddress.toLowerCase() === address.toLowerCase()
          console.log('validateInfo', validateInfo)
          validatedCryptos[crypto] = validateInfo
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
