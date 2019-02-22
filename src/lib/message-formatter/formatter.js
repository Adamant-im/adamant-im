import { inline, block } from './formats'
import escapeHtml from './escapeHtml'
import defaultRenderer from './renderer'

const defaultOptions = {
  escapeHtml: true
}

export class Formatter {
  options = {}
  renderer = {}

  constructor (options = {}, renderer = {}) {
    this.options = Object.assign({}, defaultOptions, options)
    this.renderer = Object.assign({}, defaultRenderer, renderer)
  }

  /**
   * Format message.
   * @param {string} str
   * @returns {string} HTML
   */
  format (str) {
    let blocks = this.getBlocks(str)
    let html = ''

    // escape html in each block
    if (this.options.escapeHtml) {
      blocks = blocks.map(block => {
        return {
          ...block,
          value: escapeHtml(block.value)
        }
      })
    }

    // transform blocks into html
    blocks.forEach(block => {
      if (block.type === 'paragraph') {
        // replace inline formats in paragraph
        let value = block.value
          .replace(inline.email, this.renderer.email)
          .replace(inline.link, this.renderer.link)
          .replace(inline.autolink, this.renderer.autolink)
          .replace(inline.bold, (match, p1) => this.renderer.bold(p1))
          .replace(inline.italic, (match, p1) => this.renderer.italic(p1))
          .replace(inline.strike, (match, p1) => this.renderer.strike(p1))
          .replace(inline.code, (match, p1) => this.renderer.code(p1))
          .replace(inline.br, this.renderer.br)
        html += this.renderer.paragraph(value)
      } else if (block.type === 'pre') {
        html += this.renderer.pre(block.value)
      } else if (block.type === 'quote') {
        html += this.renderer.quote(block.value)
      }
    })

    return html
  }

  /**
   * Transform string into blocks.
   *
   * type Block {
   *   type: string,
   *   value?: string
   * }
   *
   * @param {string} str
   * @returns Block[]
   */
  getBlocks (str) {
    let blocks = []
    let exec = null

    while (str) {
      // eslint-disable-next-line
      if (exec = block.newline.exec(str)) {
        str = str.substring(exec[0].length)

        continue
      }

      // eslint-disable-next-line
      if (exec = block.pre.exec(str)) {
        str = str.substring(exec[0].length)

        blocks.push({
          type: 'pre',
          value: exec[1]
        })

        continue
      }

      // eslint-disable-next-line
      if (exec = block.quote.exec(str)) {
        str = str.substring(exec[0].length)

        blocks.push({
          type: 'quote',
          value: exec[1]
        })

        continue
      }

      // eslint-disable-next-line
      if (exec = block.paragraph.exec(str)) {
        str = str.substring(exec[0].length)

        // if paragraph not contain only empty symbols
        if (!/^[\s]*$/.test(exec[0])) {
          blocks.push({
            type: 'paragraph',
            value: exec[0]
          })
        }

        continue
      }

      if (str) {
        console.error(str)
        throw new Error('Infinite loop on byte: ' + str.charCodeAt(0))
      }
    }

    return blocks
  }
}

export function removeFormats (message = '') {
  const multiline = String(message)
    .replace(block.pre, '$1')
    .replace(block.quote, '$1')
    .replace(inline.bold, '$1')
    .replace(inline.italic, '$1')
    .replace(inline.strike, '$1')
    .replace(inline.code, '$1')

  // get first line
  const exec = /^([^\n]*)\n?/.exec(multiline)

  return exec[1]
}
