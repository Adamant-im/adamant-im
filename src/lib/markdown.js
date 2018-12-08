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
  const isLink = /^(http[s]?:\/\/(www\.)?|ftp:\/\/(www\.)?|\/\/(www\.)?|www.){1}([0-9A-Za-z-.@:%_+~#=]+)+((\.[a-zA-Z]{2,3})+)(\/(.)*)?(\?(.)*)?/

  if (!isLink.test(href)) {
    return href
  }

  return ['<a target="_blank" href="', href, '">', href, '</a>'].join('')
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
