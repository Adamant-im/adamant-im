/**
 * Copy to clipboard helper.
 *
 * @param {string} data
 */
export function copyToClipboard (data) {
  let el = document.createElement('textarea')
  el.value = data

  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
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
