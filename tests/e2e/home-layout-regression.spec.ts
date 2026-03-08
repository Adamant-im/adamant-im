import { expect, test, type Page } from '@playwright/test'
import { loginWithNewAccount } from './helpers/auth'

const assertNoDocumentScrollLeak = async (page: Page) => {
  const documentMetrics = await page.evaluate(() => {
    const root = document.documentElement
    const body = document.body

    return {
      scrollHeight: root.scrollHeight,
      clientHeight: root.clientHeight,
      scrollTop: root.scrollTop || body.scrollTop || 0
    }
  })

  expect(documentMetrics.scrollHeight - documentMetrics.clientHeight).toBeLessThanOrEqual(2)
  expect(documentMetrics.scrollTop).toBe(0)
}

test.describe('Home layout regressions', () => {
  test('keeps wallet card spacing and typography stable on desktop', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/home')
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.wallet-card')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const walletCardList = document.querySelector('.wallet-card__list') as HTMLElement | null
      const walletCardTiles = Array.from(
        document.querySelectorAll('.wallet-card__list .wallet-card__tile')
      ) as HTMLElement[]
      const walletCardTile = walletCardTiles.at(-1) ?? null
      const walletCardSubtitle = document.querySelector(
        '.wallet-card__subtitle'
      ) as HTMLElement | null
      const walletActionItem = document.querySelector(
        '.wallet-actions .v-list-item'
      ) as HTMLElement | null

      if (!walletCardList || !walletCardTile || !walletCardSubtitle || !walletActionItem) {
        return null
      }

      const walletCardListStyle = getComputedStyle(walletCardList)
      const walletCardTileStyle = getComputedStyle(walletCardTile)
      const walletCardSubtitleStyle = getComputedStyle(walletCardSubtitle)
      const walletActionItemStyle = getComputedStyle(walletActionItem)
      const walletCardTileRect = walletCardTile.getBoundingClientRect()
      const walletActionItemRect = walletActionItem.getBoundingClientRect()
      const stakeIcon = document.querySelector(
        '.wallet-actions .icon .svg-icon'
      ) as SVGElement | null

      return {
        walletCardListPaddingTop: Number.parseFloat(walletCardListStyle.paddingTop),
        walletCardTilePaddingInlineStart: Number.parseFloat(walletCardTileStyle.paddingInlineStart),
        walletCardTilePaddingInlineEnd: Number.parseFloat(walletCardTileStyle.paddingInlineEnd),
        walletCardSubtitleLineHeight: Number.parseFloat(walletCardSubtitleStyle.lineHeight),
        walletActionItemPaddingInlineStart: Number.parseFloat(
          walletActionItemStyle.paddingInlineStart
        ),
        walletActionItemPaddingInlineEnd: Number.parseFloat(walletActionItemStyle.paddingInlineEnd),
        walletActionItemMinHeight: Number.parseFloat(walletActionItemStyle.minHeight),
        walletActionGapFromBalance: walletActionItemRect.top - walletCardTileRect.bottom,
        stakeIconWidth: stakeIcon?.getBoundingClientRect().width ?? 0,
        stakeIconHeight: stakeIcon?.getBoundingClientRect().height ?? 0
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.walletCardListPaddingTop ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.walletCardListPaddingTop ?? 99).toBeLessThanOrEqual(9)
    expect(metrics?.walletCardTilePaddingInlineStart ?? 0).toBeGreaterThanOrEqual(27)
    expect(metrics?.walletCardTilePaddingInlineStart ?? 99).toBeLessThanOrEqual(29)
    expect(metrics?.walletCardTilePaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(15)
    expect(metrics?.walletCardTilePaddingInlineEnd ?? 99).toBeLessThanOrEqual(17)
    expect(metrics?.walletCardSubtitleLineHeight ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.walletCardSubtitleLineHeight ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.walletActionItemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(27)
    expect(metrics?.walletActionItemPaddingInlineStart ?? 99).toBeLessThanOrEqual(29)
    expect(metrics?.walletActionItemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(27)
    expect(metrics?.walletActionItemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(29)
    expect(metrics?.walletActionItemMinHeight ?? 0).toBeGreaterThanOrEqual(55)
    expect(metrics?.walletActionItemMinHeight ?? 99).toBeLessThanOrEqual(57)
    expect(metrics?.walletActionGapFromBalance ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.walletActionGapFromBalance ?? 99).toBeLessThanOrEqual(9)
    expect(metrics?.stakeIconWidth ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.stakeIconWidth ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.stakeIconHeight ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.stakeIconHeight ?? 99).toBeLessThanOrEqual(25)

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps wallet card spacing stable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/home')
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.wallet-card')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const walletCardTiles = Array.from(
        document.querySelectorAll('.wallet-card__list .wallet-card__tile')
      ) as HTMLElement[]
      const walletCardTile = walletCardTiles.at(-1) ?? null
      const walletActionItem = document.querySelector(
        '.wallet-actions .v-list-item'
      ) as HTMLElement | null

      if (!walletCardTile || !walletActionItem) {
        return null
      }

      const walletCardTileStyle = getComputedStyle(walletCardTile)
      const walletActionItemStyle = getComputedStyle(walletActionItem)
      const walletCardTileRect = walletCardTile.getBoundingClientRect()
      const walletActionItemRect = walletActionItem.getBoundingClientRect()

      return {
        walletCardTilePaddingInlineStart: Number.parseFloat(walletCardTileStyle.paddingInlineStart),
        walletCardTilePaddingInlineEnd: Number.parseFloat(walletCardTileStyle.paddingInlineEnd),
        walletActionItemPaddingInlineStart: Number.parseFloat(
          walletActionItemStyle.paddingInlineStart
        ),
        walletActionItemPaddingInlineEnd: Number.parseFloat(walletActionItemStyle.paddingInlineEnd),
        walletActionGapFromBalance: walletActionItemRect.top - walletCardTileRect.bottom
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.walletCardTilePaddingInlineStart ?? 0).toBeGreaterThanOrEqual(27)
    expect(metrics?.walletCardTilePaddingInlineStart ?? 99).toBeLessThanOrEqual(29)
    expect(metrics?.walletCardTilePaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(15)
    expect(metrics?.walletCardTilePaddingInlineEnd ?? 99).toBeLessThanOrEqual(17)
    expect(metrics?.walletActionItemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(27)
    expect(metrics?.walletActionItemPaddingInlineStart ?? 99).toBeLessThanOrEqual(29)
    expect(metrics?.walletActionItemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(27)
    expect(metrics?.walletActionItemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(29)
    expect(metrics?.walletActionGapFromBalance ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.walletActionGapFromBalance ?? 99).toBeLessThanOrEqual(9)

    await assertNoDocumentScrollLeak(page)
  })
})
