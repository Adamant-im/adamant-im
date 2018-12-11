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
  const pattern = /^(eth|bch|bitcoin|https?|s?ftp|magnet|tor|onion|tg):(.*)$/i

  if (pattern.test(href)) {
    return `<a href="${href}">${href}</a>`
  }

  return text
}

renderer.heading = function (text) {
  return `<p>${text}</p>`
}

/**
 * Renders markdown-formatted input to HTML
 * @param {string} text text to render
 * @returns {string} resulting HTML
 */
export default function render (text = '') {
  return marked(text, { renderer })
}
