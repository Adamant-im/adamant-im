import bold, { pattern } from '../../src/formats/bold'

const tests = [
  {
    name: 'one match',
    text: `To bold, surround your text with asterisks: *your text*`,
    matches: ['*your text*']
  },
  {
    name: 'multiple matches',
    text: `To *bold*, surround your text with asterisks: *your text*`,
    matches: ['*bold*', '*your text*']
  },
  {
    name: 'multiline',
    text: `Lorem Ipsum is *simply* dummy text of the printing and typesetting industry.
Lorem Ipsum has *been* the industry's *standard* dummy text ever since the 1500s.`,
    matches: ['*simply*', '*been*', '*standard*']
  }
]

describe('formats.bold', () => {
  describe('text replace tests', () => {
    it('one match', () => {
      const text = `To bold, surround your text with asterisks: *your text*`

      expect(bold(text)).toBe(`To bold, surround your text with asterisks: <strong>your text</strong>`)
    })
  })

  describe('regex tests', () => {
    tests.forEach(test => {
      it(test.name, () => {
        const matches = test.text.match(pattern)

        expect(matches).toEqual(test.matches)
      })
    })
  })
})
