import { Formatter } from '../formatter'

describe('Formatter', () => {
  let formatter

  beforeEach(() => {
    formatter = new Formatter()
  })

  it('should match top-level blocks', () => {
    const blocks = formatter.getBlocks(`Lorem ipsum dolor sit amet.
In elementum vitae ipsum in gravida.
In hac habitasse platea dictumst.

Nulla commodo ipsum quis faucibus congue. Sed vitae justo ante.
Nam efficitur dui ornare leo interdum vulputate.

\`\`\`Phasellus luctus consectetur nulla, a vehicula mi blandit vel.\`\`\`

Fusce semper, velit eu congue fermentum, enim massa blandit ligula.

> Sit amet consequat orci nisl ullamcorper ipsum.`)

    expect(blocks).toEqual([
      {
        type: 'paragraph',
        value: 'Lorem ipsum dolor sit amet.\nIn elementum vitae ipsum in gravida.\nIn hac habitasse platea dictumst.'
      },
      {
        type: 'paragraph',
        value: 'Nulla commodo ipsum quis faucibus congue. Sed vitae justo ante.\nNam efficitur dui ornare leo interdum vulputate.'
      },
      {
        type: 'pre',
        value: 'Phasellus luctus consectetur nulla, a vehicula mi blandit vel.'
      },
      {
        type: 'paragraph',
        value: 'Fusce semper, velit eu congue fermentum, enim massa blandit ligula.'
      },
      {
        type: 'quote',
        value: 'Sit amet consequat orci nisl ullamcorper ipsum.'
      }
    ])
  })

  it('should trim extra newlines', () => {
    const blocks = formatter.getBlocks(`

Paragraph1

Paragraph2


`)
    expect(blocks).toEqual([
      {
        type: 'paragraph',
        value: 'Paragraph1'
      },
      {
        type: 'paragraph',
        value: 'Paragraph2'
      }
    ])
  })

  it('should match single paragraph', () => {
    const blocks = formatter.getBlocks(`Paragraph`)

    expect(blocks).toEqual([
      {
        type: 'paragraph',
        value: 'Paragraph'
      }
    ])
  })

  it('should return empty array when empty string', () => {
    const blocks = formatter.getBlocks('')

    expect(blocks).toEqual([])
  })

  it('should return empty array when only newlines', () => {
    const blocks = formatter.getBlocks(`

`)

    expect(blocks).toEqual([])
  })

  it('should return empty array when only spaces', () => {
    const blocks = formatter.getBlocks('\t')

    expect(blocks).toEqual([])
  })

  describe('format() method', () => {
    it('format paragraphs', () => {
      const message = `P1 Line1
P1 Line2

P2 Line1

P3 Line1
P3 Line2
`

      expect(formatter.format(message)).toBe('<p>P1 Line1<br>P1 Line2</p><p>P2 Line1</p><p>P3 Line1<br>P3 Line2</p>')
    })

    it('should not format inline elements when `LF` is present', () => {
      expect(formatter.format('*bold*')).toBe('<p><strong>bold</strong></p>')
      expect(formatter.format('*bo\nld*')).toBe('<p>*bo<br>ld*</p>')

      expect(formatter.format('_italic_')).toBe('<p><i>italic</i></p>')
      expect(formatter.format('_ita\nlic_')).toBe('<p>_ita<br>lic_</p>')

      expect(formatter.format('~strike~')).toBe('<p><strike>strike</strike></p>')
      expect(formatter.format('~str\nike~')).toBe('<p>~str<br>ike~</p>')

      expect(formatter.format('`code`')).toBe('<p><code>code</code></p>')
      expect(formatter.format('`co\nde`')).toBe('<p>`co<br>de`</p>')
    })
  })
})
