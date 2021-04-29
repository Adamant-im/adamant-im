/**
 * Copy to clipboard helper.
 *
 * @param {string} data
 */
export function copyToClipboard (data) {
  let el = document.createElement('textarea')
  el.value = data
  document.body.appendChild(el)

  var isiOSDevice = navigator.userAgent.match(/ipad|iphone/i)
  console.log(navigator.userAgent)
  if (isiOSDevice) {
    console.log('iOS+')
    copyToClipboardIos(el)
  } else {
    console.log('iOS-')
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
  var range = document.createRange()
  el.contentEditable = true
  el.readOnly = false
  range.selectNodeContents(el)

  var s = window.getSelection()
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
  var file = new Blob([data], { type: type })
  if (window.navigator.msSaveOrOpenBlob) { // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename)
  } else { // Others
    var a = document.createElement('a')
    var url = URL.createObjectURL(file)
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
