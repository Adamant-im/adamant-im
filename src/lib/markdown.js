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
  let prot = null
  try {
    prot = decodeURIComponent(unescape(href))
      .replace(/[^\w:]/g, '')
      .toLowerCase()
  } catch (e) {
    return text
  }

  if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
    return text
  }

  text = text || href
  return ['<a href="', href, '">', text, '</a>'].join('')
}

/**
 * Renders markdown-formatted input to HTML
 * @param {string} text text to render
 * @returns {string} resulting HTML
 */
export default function render (text = '') {
  return marked(text, { renderer })
}
