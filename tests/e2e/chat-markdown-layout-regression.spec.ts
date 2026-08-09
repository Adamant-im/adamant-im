import { expect, test, type Page } from '@playwright/test'

/**
 * Layout regressions for markdown rendered inside a chat bubble.
 *
 * These properties cannot be covered by the unit tests: jsdom has no layout engine, so
 * `scrollWidth`, computed borders and cell heights are all zero there. The markup itself is
 * covered in `src/lib/markdown.spec.ts` and `src/components/common/__tests__/SafeHtml.spec.ts`;
 * this file only checks that the stylesheet does the right thing with it.
 *
 * The probe is injected into the loaded application, so the styles under test are the ones the
 * app actually ships, and no account, node or chat history is needed. Reading a built stylesheet
 * was tried first and silently skipped in CI, where Playwright runs against the dev server and
 * `dist/` never exists.
 */
const PROBE_ID = 'markdown-layout-probe'
const PROBE_WIDTH = 900
const PROBE_PADDING = 24
/** `.a-chat__message-container` caps the bubble at 80% of the available width */
const BUBBLE_MAX_RATIO = 0.8

const TABLE_HTML = `<div class="a-chat__message-table"><table>
<thead><tr>
${Array.from({ length: 18 }, (_, i) => `<th>Column ${String(i + 1).padStart(2, '0')}</th>`).join('')}
</tr></thead>
<tbody>
<tr>${Array.from({ length: 18 }, (_, i) => `<td>A${i + 1}</td>`).join('')}</tr>
<tr>
<td>B1</td><td><strong>Bold</strong></td><td><em>Italic</em></td><td><code>code</code></td>
<td><a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a></td>
${Array.from({ length: 8 }, (_, i) => `<td>C${i + 1}</td>`).join('')}
<td class="long-token">длинный-текст-без-пробелов-для-проверки-переноса</td>
<td>normal text</td><td>99.999%</td><td>v136.0.0</td><td>Final column</td>
</tr>
</tbody></table></div>`

const NESTED_QUOTE_HTML = `<blockquote>
<p>Outer quote.</p>
<p>It can span several lines.</p>
<blockquote><p>And this one is nested.</p></blockquote>
</blockquote>`

/**
 * Loads the app so its stylesheet is present, then pins a probe over it. The probe reproduces
 * the chat bubble's element chain, which is what constrains the markdown content.
 */
async function mountProbe(page: Page, inner: string, theme: 'light' | 'dark') {
  await page.goto('/')
  // Vuetify puts the theme class on its own root, not on `<html>`; the stylesheet is in place
  // once that element exists
  await page.waitForSelector('.v-application', { state: 'attached' })

  await page.evaluate(
    ({ id, html, width, padding, themeName }) => {
      document.getElementById(id)?.remove()

      // The theme class goes on the probe itself, so the test does not depend on which theme
      // the application happens to have loaded with
      const probe = document.createElement('div')
      probe.id = id
      probe.className = `v-application v-theme--${themeName}`
      probe.setAttribute(
        'style',
        `position:fixed;top:0;left:0;z-index:99999;width:${width}px;padding:${padding}px`
      )
      probe.innerHTML = `
        <div class="a-chat__message-container"><div class="a-chat__message"><div class="a-chat__message-card">
          <div class="a-chat__message-card-body"><div class="a-chat__message-text">${html}</div></div>
        </div></div></div>`

      document.body.append(probe)
    },
    { id: PROBE_ID, html: inner, width: PROBE_WIDTH, padding: PROBE_PADDING, themeName: theme }
  )
}

test.describe('chat markdown layout', () => {
  test('a wide table scrolls inside the bubble instead of stretching it', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 })
    await mountProbe(page, TABLE_HTML, 'light')

    const scroller = await page
      .locator(`#${PROBE_ID} .a-chat__message-table`)
      .evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: getComputedStyle(element).overflowX
      }))

    // The table overflows its container, and the container is what scrolls
    expect(scroller.overflowX).toBe('auto')
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)

    // The bubble stays within its own limit rather than being pushed wide by the table
    const bubble = await page.locator(`#${PROBE_ID} .a-chat__message-container`).boundingBox()
    const available = PROBE_WIDTH - PROBE_PADDING * 2

    expect(bubble!.width).toBeLessThanOrEqual(available * BUBBLE_MAX_RATIO + 1)
  })

  test('table cells opt out of the aggressive word breaking used for message text', async ({
    page
  }) => {
    await mountProbe(page, TABLE_HTML, 'light')

    const header = await page
      .locator(`#${PROBE_ID} th`)
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
    await mountProbe(page, TABLE_HTML, 'light')

    const cell = await page.locator(`#${PROBE_ID} td.long-token`).evaluate((element) => {
      const style = getComputedStyle(element)
      const lineHeight = parseFloat(style.lineHeight) || 20

      return {
        width: element.getBoundingClientRect().width,
        lines: Math.round(element.getBoundingClientRect().height / lineHeight),
        maxWidth: style.maxWidth
      }
    })

    // Without the cap this single 48-character token made one column wider than the bubble
    expect(cell.maxWidth).not.toBe('none')
    expect(cell.width).toBeLessThan(260)
    expect(cell.lines).toBeGreaterThan(1)
  })

  test('columns of short values do not collapse to a couple of characters', async ({ page }) => {
    await mountProbe(page, TABLE_HTML, 'light')

    const widths = await page
      .locator(`#${PROBE_ID} thead th`)
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width))

    expect(Math.min(...widths)).toBeGreaterThan(40)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`nested quotes show a visible bar at every level in the ${theme} theme`, async ({
      page
    }) => {
      await mountProbe(page, NESTED_QUOTE_HTML, theme)

      const quotes = await page.locator(`#${PROBE_ID} blockquote`).evaluateAll((elements) =>
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
