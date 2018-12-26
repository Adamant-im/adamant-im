import marked from 'marked'

marked.setOptions({
  sanitize: true,
  gfm: true,
  breaks: true
})

const renderer = new marked.Renderer()

renderer.image = function (href, title, text) {
  return ''
}

renderer.link = function (href, title, text) {
  const linkPattern = /^(eth|bch|bitcoin|https?|s?ftp|magnet|tor|onion|tg):(.*)$/i
  const emailPattern = /^(mailto):[^@]+@[^@]+\.[^@]+$/i

  if (linkPattern.test(href)) {
    return `<a href="${href}">${href}</a>`
  } else if (emailPattern.test(href)) {
    return `<a href="${href}">${text}</a>`
  }

  return text
}

renderer.heading = function (text) {
  return `<p>${text}</p>`
}

renderer.text = function (text) {
  // (^|\s) - start of the line or space
  // ($|\s) - end of the line or space
  const linkPattern = /(^|\s)([a-z.\u0400-\u04FF]+)\.([a-z\u0400-\u04FF]{2,})($|\s)/ig

  return text.replace(linkPattern, `$1<a href="http://$2.$3">$2.$3</a>$4`)
}

/**
 * Renders markdown-formatted input to HTML
 * @param {string} text text to render
 * @returns {string} resulting HTML
 */
export default function render (text = '') {
  return marked(text, { renderer })
}
