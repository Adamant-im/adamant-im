import bitcoin from 'bitcoinjs-lib'

export function isValidAddress (address) {
  try {
    bitcoin.address.toOutputScript(address)
  } catch (e) {
    return false
  }

  return true
}
