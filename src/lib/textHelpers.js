/**
 * Download file helper.
 *
 * @param {string} data
 * @param {string} filename
 * @param {string} type Example `text/plain`
 */
export function downloadFile(data, filename, type) {
  const file = new Blob([data], { type: type })
  if (window.navigator.msSaveOrOpenBlob) {
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename)
  } else {
    // Others
    const a = document.createElement('a')
    const url = URL.createObjectURL(file)
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 0)
  }
}

/**
 * Returns array of unique case insensitive values
 * @param {Array} values
 */
export function uniqueCaseInsensitiveArray(values) {
  return [...new Map(values.map((s) => [s.toLowerCase(), s])).values()]
}

/**
 * Compares two strings, case insensitive
 * @param {string} string1
 * @param {string} string2
 * @return {boolean} true, if strings are equal, case insensitive
 */
export function isStringEqualCI(string1, string2) {
  if (typeof string1 !== 'string' || typeof string2 !== 'string') return false
  return string1.toUpperCase() === string2.toUpperCase()
}

export function strictCapitalize(string) {
  return string[0].toUpperCase() + string.slice(1).toLowerCase()
}
