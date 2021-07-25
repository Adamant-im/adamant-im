/**
 * Copy to clipboard helper.
 *
 * @param {string} data
 */
export function copyToClipboard (data) {
  const el = document.createElement('textarea')
  el.value = data
  document.body.appendChild(el)

  // this will make fake positive result in Chrome's simulator, and the function will not work
  // https://chromium.googlesource.com/chromium/src/+/master/docs/ios/user_agent.md
  // https://stackoverflow.com/questions/28083715/how-to-detect-if-a-mobile-device-is-emulated-by-google-chrome
  const isiOSDevice = navigator.userAgent.match(/ipad|iphone/i)

  if (isiOSDevice) {
    copyToClipboardIos(el)
  } else {
    el.select()
    document.execCommand('copy')
  }
  document.body.removeChild(el)
}

/**
 * Copy to clipboard helper for iOS devices
 *
 * @param {HTMLTextAreaElement} el
 */
function copyToClipboardIos (el) {
  const range = document.createRange()
  el.contentEditable = true
  el.readOnly = false
  range.selectNodeContents(el)

  const s = window.getSelection()
  s.removeAllRanges()
  s.addRange(range)
  el.setSelectionRange(0, 999999) // A big number, to cover anything that could be inside the element.

  document.execCommand('copy')
}

/**
 * Download file helper.
 *
 * @param {string} data
 * @param {string} filename
 * @param {string} type Example `text/plain`
 */
export function downloadFile (data, filename, type) {
  const file = new Blob([data], { type: type })
  if (window.navigator.msSaveOrOpenBlob) { // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename)
  } else { // Others
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
export function uniqueCaseInsensitiveArray (values) {
  return [...new Map(values.map(s => [s.toLowerCase(), s])).values()]
}

/**
 * Compares two strings, case insensitive
 * @param {string} string1
 * @param {string} string2
 * @return {boolean} true, if strings are equal, case insensitive
 */
export function isStringEqualCI (string1, string2) {
  if (typeof string1 !== 'string' || typeof string2 !== 'string') return false
  return string1.toUpperCase() === string2.toUpperCase()
}
