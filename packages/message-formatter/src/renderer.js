export default {
  paragraph (text) {
    return `<p>${text}</p>`
  },
  pre (text) {
    return `<pre>${text}</pre>`
  },
  quote (text) {
    return `<q>${text}</q>`
  },
  email (text) {
    return `<a href="mailto:${text}">${text}</a>`
  },
  link (url) {
    return `<a href="${url}">${url}</a>`
  },
  autolink (text) {
    return `<a href="//:${text}">${text}</a>`
  },
  bold (text) {
    return `<strong>${text}</strong>`
  },
  italic (text) {
    return `<i>${text}</i>`
  },
  strike (text) {
    return `<strike>${text}</strike>`
  },
  code (text) {
    return `<code>${text}</code>`
  },
  br () {
    return `<br>`
  }
}
