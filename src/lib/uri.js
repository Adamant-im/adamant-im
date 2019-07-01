export const pattern = /^adm:(U[0-9]{6,})(\?(\w+(=[^?&=]*)?(&\w+(=[^?&=]*)?)*)?)?$/i

/**
 * AIP 2: URI Format for ADAMANT
 *
 * @param {string} str
 * @returns {
 *   {
 *     address: string,
 *     params: Map<string, string>
 *   } | undefined
 * }
 */
export function parseURI (str) {
  const match = str.match(pattern)

  if (match) {
    let data = {
      address: match[1],
      params: {}
    }

    if (match[2]) {
      data.params = match[2]
        .slice(1) // remove ? symbol
        .split('&')
        .reduce((acc, keyValue) => {
          const [key, value] = keyValue.split('=')

          if (key === '') return acc

          return {
            ...acc,
            [key]: value !== undefined ? decodeURI(value) : value
          }
        }, {})
    }

    return data
  }
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
