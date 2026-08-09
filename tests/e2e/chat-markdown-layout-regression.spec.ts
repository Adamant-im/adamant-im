import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * Layout regressions for markdown rendered inside a chat bubble.
 *
 * These properties cannot be covered by the unit tests: jsdom has no layout engine, so
 * `scrollWidth`, computed borders and cell heights are all zero there. The markup itself is
 * covered in `src/lib/markdown.spec.ts` and `src/components/common/__tests__/SafeHtml.spec.ts`;
 * this file only checks that the stylesheet does the right thing with it.
 *
 * The page is assembled from the built stylesheet rather than driven through the real app, so
 * the test stays under a second and needs no account, no node and no chat history.
 */
const DIST_ASSETS = 'dist/assets'

const stylesheet = (() => {
  if (!existsSync(DIST_ASSETS)) return null

  const file = readdirSync(DIST_ASSETS).find(
    (name) => name.startsWith('index-') && name.endsWith('.css')
  )

  return file ? readFileSync(`${DIST_ASSETS}/${file}`, 'utf8') : null
})()

/**
 * Output of `renderMarkdown()` for an eighteen-column table, wrapped the way `SafeHtml` wraps
 * it. Kept as a literal so this test does not depend on the app bundle being importable.
 */
const TABLE_HTML = `<div class="a-chat__message-table"><table>
<thead>
<tr>
${Array.from({ length: 18 }, (_, i) => `<th>Column ${String(i + 1).padStart(2, '0')}</th>`).join('\n')}
</tr>
</thead>
<tbody><tr>
${Array.from({ length: 18 }, (_, i) => `<td>A${i + 1}</td>`).join('\n')}
</tr>
<tr>
<td>B1</td>
<td><strong>Bold</strong></td>
<td><em>Italic</em></td>
<td><code>code</code></td>
<td><a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a></td>
${Array.from({ length: 8 }, (_, i) => `<td>C${i + 1}</td>`).join('\n')}
<td class="long-token">длинный-текст-без-пробелов-для-проверки-переноса</td>
<td>normal text</td>
<td>99.999%</td>
<td>v136.0.0</td>
<td>Final column</td>
</tr>
</tbody></table></div>`

const NESTED_QUOTE_HTML = `<blockquote>
<p>Outer quote.</p>
<p>It can span several lines.</p>
<blockquote>
<p>And this one is nested.</p>
</blockquote>
</blockquote>`

const PAGE_WIDTH = 900
const PAGE_PADDING = 24
/** `.a-chat__message-container` caps the bubble at 80% of the available width */
const BUBBLE_MAX_RATIO = 0.8

function buildPage(inner: string, theme: 'light' | 'dark') {
  return `<!doctype html>
<html class="v-theme--${theme}">
  <head><style>${stylesheet}
    body { margin: 0; font-family: sans-serif; }
    .page { width: ${PAGE_WIDTH}px; padding: ${PAGE_PADDING}px; }
  </style></head>
  <body><div class="page">
    <div class="a-chat__message-container"><div class="a-chat__message"><div class="a-chat__message-card">
      <div class="a-chat__message-card-body"><div class="a-chat__message-text">${inner}</div></div>
    </div></div></div>
  </div></body>
</html>`
}

test.describe('chat markdown layout', () => {
  test.skip(!stylesheet, 'Requires a production build: run `npm run build` first')

  test('a wide table scrolls inside the bubble instead of stretching it', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 700 })
    await page.setContent(buildPage(TABLE_HTML, 'light'))

    const scroller = await page.locator('.a-chat__message-table').evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX
    }))

    // The table overflows its container, and the container is what scrolls
    expect(scroller.overflowX).toBe('auto')
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)

    // The bubble stays within its own limit rather than being pushed wide by the table
    const bubble = await page.locator('.a-chat__message-container').boundingBox()
    const available = PAGE_WIDTH - PAGE_PADDING * 2

    expect(bubble!.width).toBeLessThanOrEqual(available * BUBBLE_MAX_RATIO + 1)

    // And nothing escapes the document
    const documentOverflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )

    expect(documentOverflows).toBe(false)
  })

  test('table cells opt out of the aggressive word breaking used for message text', async ({
    page
  }) => {
    await page.setContent(buildPage(TABLE_HTML, 'light'))

    const header = await page
      .locator('th')
      .first()
      .evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        wordBreak: getComputedStyle(element).wordBreak
      }))

    // `word-break: break-word` on the message body used to split every heading mid-word,
    // collapsing each column to a few characters
    expect(header.wordBreak).toBe('normal')
    expect(header.height).toBeLessThan(40)
  })

  test('a long cell wraps within a capped column instead of widening it', async ({ page }) => {
    await page.setContent(buildPage(TABLE_HTML, 'light'))

    const cell = await page.locator('td.long-token').evaluate((element) => {
      const style = getComputedStyle(element)
      const lineHeight = parseFloat(style.lineHeight) || 20

      return {
        width: element.getBoundingClientRect().width,
        lines: Math.round(element.getBoundingClientRect().height / lineHeight),
        maxWidth: style.maxWidth
      }
    })

    // Without the cap this single 48-character token made one column wider than the whole bubble
    expect(cell.maxWidth).not.toBe('none')
    expect(cell.width).toBeLessThan(260)
    expect(cell.lines).toBeGreaterThan(1)
  })

  test('columns of short values do not collapse to a couple of characters', async ({ page }) => {
    await page.setContent(buildPage(TABLE_HTML, 'light'))

    const widths = await page
      .locator('thead th')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width))

    expect(Math.min(...widths)).toBeGreaterThan(40)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`nested quotes show a visible bar at every level in the ${theme} theme`, async ({
      page
    }) => {
      await page.setContent(buildPage(NESTED_QUOTE_HTML, theme))

      const quotes = await page.locator('blockquote').evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element)

          return {
            borderStyle: style.borderLeftStyle,
            borderWidth: parseFloat(style.borderLeftWidth),
            borderColor: style.borderLeftColor,
            paddingLeft: parseFloat(style.paddingLeft)
          }
        })
      )

      expect(quotes).toHaveLength(2)

      for (const quote of quotes) {
        expect(quote.borderStyle).toBe('solid')
        expect(quote.borderWidth).toBeGreaterThan(0)
        expect(quote.borderColor).not.toBe('rgba(0, 0, 0, 0)')
        expect(quote.paddingLeft).toBeGreaterThan(0)
      }
    })
  }
})
