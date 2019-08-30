import { Cryptos, RE_DASH_ADDRESS, RE_DOGE_ADDRESS } from './constants'

/**
 * Parse info from an URI containing a cryptocurrency address
 * Complies with AIP-2, AIP-8, AIP-9
 * @param {string} uri URI
 * @returns {
 *   {
 *     address: string,
 *     crypto: string,
 *     params: Object<string, string>,
       protocol: string
 *   }
 * }
 */
export function parseURI (uri) {
  const [origin, query = ''] = uri.split('?')
  let address = ''
  let crypto = ''
  let params = Object.create(null)
  let protocol = ''

  if (query) {
    params = query.split('&').reduce((accum, param) => {
      const [key, value = ''] = param.split('=')

      return key && value ? {
        ...accum,
        [key]: window.decodeURIComponent(value)
      } : accum
    }, Object.create(null))
  }
  if (origin.includes(':')) {
    [protocol, address] = origin.split(':')
    if (protocol === 'ethereum') {
      crypto = Cryptos.ETH
    } else if (protocol === 'https' && /^\/\/msg.adamant.im$/.test(address)) {
      crypto = Cryptos.ADM
      address = params.address; delete params.address
    } else if (Cryptos.hasOwnProperty(protocol.toUpperCase())) {
      crypto = protocol.toUpperCase()
    }
  } else {
    address = origin
    if (RE_DASH_ADDRESS.test(address)) {
      crypto = Cryptos.DASH
    } else if (RE_DOGE_ADDRESS.test(address)) {
      crypto = Cryptos.DOGE
    }
  }

  return { address, crypto, params, protocol }
}

/**
 * Generate ADAMANT URI address.
 *
 * @param {string} address ADAMANT address
 * @param {string} name Contact name
 * @returns {string}
 */
export function generateURI (address, name) {
  return `adm:${address}${name ? '?label=' + name : ''}`
}
