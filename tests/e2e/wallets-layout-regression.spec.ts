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

test.describe('Wallets layout regressions', () => {
  test('keeps wallets shell aligned to settings content on desktop', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/options/wallets')
    await expect(page).toHaveURL(/\/options\/wallets$/)
    await expect(page.locator('div.wallets-view.w-100')).toBeVisible()
    await expect(page.locator('.wallets-view__list')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.navigation-wrapper__content') as HTMLElement | null
      const shell = document.querySelector('.settings-table-shell') as HTMLElement | null
      const bleed = document.querySelector('.settings-table-shell__bleed') as HTMLElement | null
      const sections = document.querySelectorAll('.settings-table-shell__section')
      const beforeSection = sections[0] as HTMLElement | undefined
      const afterSection = sections[1] as HTMLElement | undefined
      const list = document.querySelector('.wallets-view__list') as HTMLElement | null

      if (!content || !shell || !bleed || !beforeSection || !afterSection || !list) {
        return null
      }

      const contentRect = content.getBoundingClientRect()
      const shellStyle = getComputedStyle(shell)
      const contentStyle = getComputedStyle(content)
      const bleedStyle = getComputedStyle(bleed)
      const beforeStyle = getComputedStyle(beforeSection)
      const afterStyle = getComputedStyle(afterSection)
      const bleedRect = bleed.getBoundingClientRect()
      const listRect = list.getBoundingClientRect()

      return {
        bleedInlineStartVar: shellStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-start')
          .trim(),
        bleedInlineEndVar: shellStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-end')
          .trim(),
        marginInlineStart: Number.parseFloat(bleedStyle.marginInlineStart),
        marginInlineEnd: Number.parseFloat(bleedStyle.marginInlineEnd),
        contentPaddingInlineStart: Number.parseFloat(contentStyle.paddingInlineStart),
        contentPaddingInlineEnd: Number.parseFloat(contentStyle.paddingInlineEnd),
        beforePaddingInlineStart: Number.parseFloat(beforeStyle.paddingInlineStart),
        beforePaddingInlineEnd: Number.parseFloat(beforeStyle.paddingInlineEnd),
        afterPaddingInlineStart: Number.parseFloat(afterStyle.paddingInlineStart),
        afterPaddingInlineEnd: Number.parseFloat(afterStyle.paddingInlineEnd),
        bleedLeftGap: bleedRect.left - contentRect.left,
        bleedRightGap: contentRect.right - bleedRect.right,
        listBleedLeftGap: listRect.left - bleedRect.left,
        listBleedRightGap: bleedRect.right - listRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.bleedInlineStartVar).not.toBe('')
    expect(metrics?.bleedInlineEndVar).not.toBe('')
    expect(metrics?.marginInlineStart ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineStart ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.marginInlineEnd ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineEnd ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.contentPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.contentPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.beforePaddingInlineStart ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.beforePaddingInlineEnd ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.afterPaddingInlineStart ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.afterPaddingInlineEnd ?? 99).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.bleedLeftGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.bleedRightGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.listBleedLeftGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.listBleedRightGap ?? 99)).toBeLessThanOrEqual(1)

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps reset below the fold until the shared sidebar pane scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await loginWithNewAccount(page)

    await page.goto('/options/wallets')
    await expect(page).toHaveURL(/\/options\/wallets$/)
    await expect(page.locator('div.wallets-view.w-100')).toBeVisible()
    await expect(page.locator('.sidebar__layout.a-scroll-pane')).toBeVisible()

    const sidebarPane = page.locator('.sidebar__layout.a-scroll-pane')

    const initialMetrics = await page.evaluate(() => {
      const pane = document.querySelector('.sidebar__layout.a-scroll-pane') as HTMLElement | null
      const button = document.querySelector('.wallets-view .a-btn-primary') as HTMLElement | null

      if (!pane || !button) {
        return null
      }

      const paneStyle = getComputedStyle(pane)
      const paneRect = pane.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      return {
        paneOverflowY: paneStyle.overflowY,
        canScroll: pane.scrollHeight > pane.clientHeight + 1,
        scrollTop: pane.scrollTop,
        buttonBelowPane: buttonRect.top > paneRect.bottom + 1
      }
    })

    expect(initialMetrics).not.toBeNull()
    expect(initialMetrics?.paneOverflowY).toBe('auto')
    expect(initialMetrics?.canScroll).toBe(true)
    expect(initialMetrics?.scrollTop).toBe(0)
    expect(initialMetrics?.buttonBelowPane).toBe(true)

    await sidebarPane.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })

    await expect.poll(() => sidebarPane.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)

    const scrolledMetrics = await page.evaluate(() => {
      const pane = document.querySelector('.sidebar__layout.a-scroll-pane') as HTMLElement | null
      const button = document.querySelector('.wallets-view .a-btn-primary') as HTMLElement | null

      if (!pane || !button) {
        return null
      }

      const paneRect = pane.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      return {
        paneTop: paneRect.top,
        paneBottom: paneRect.bottom,
        buttonTop: buttonRect.top,
        buttonBottom: buttonRect.bottom
      }
    })

    expect(scrolledMetrics).not.toBeNull()
    expect((scrolledMetrics?.buttonTop ?? 0) + 1).toBeGreaterThanOrEqual(
      scrolledMetrics?.paneTop ?? 0
    )
    expect((scrolledMetrics?.buttonBottom ?? 9999) - 1).toBeLessThanOrEqual(
      scrolledMetrics?.paneBottom ?? 0
    )

    await page.getByRole('button', { name: /reset/i }).click()
    await expect(page.locator('.wallet-reset-dialog .v-overlay__content')).toBeVisible()

    const dialogMetrics = await page
      .locator('.wallet-reset-dialog .v-overlay__content')
      .evaluate((element) => {
        return {
          width: element.getBoundingClientRect().width,
          inlineWidth: (element as HTMLElement).style.width
        }
      })

    expect(dialogMetrics.inlineWidth).toBe('var(--a-secondary-dialog-width)')
    expect(dialogMetrics.width).toBeLessThanOrEqual(500)
    expect(dialogMetrics.width).toBeGreaterThanOrEqual(440)

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps wallets search and list item sizing consistent', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/options/wallets')
    await expect(page).toHaveURL(/\/options\/wallets$/)

    const searchField = page.locator('.wallets-view__search .v-field')
    const cryptoContent = page.locator('.wallets-view__crypto-content').first()
    const balance = page.locator('.wallet-balance').first()

    await expect(searchField).toBeVisible()
    await expect(cryptoContent).toBeVisible()
    await expect(balance).toBeVisible()

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.wallets-view__crypto-content') as HTMLElement | null
      const subtitle = document.querySelector(
        '.wallets-view__crypto-subtitle'
      ) as HTMLElement | null
      const subtitleMuted = document.querySelector(
        '.wallets-view__crypto-subtitle-muted'
      ) as HTMLElement | null
      const subtitleBold = document.querySelector(
        '.wallets-view__crypto-subtitle-bold'
      ) as HTMLElement | null
      const walletBalance = document.querySelector('.wallet-balance') as HTMLElement | null

      if (!content || !subtitle || !subtitleMuted || !subtitleBold || !walletBalance) {
        return null
      }

      const contentStyle = getComputedStyle(content)
      const subtitleStyle = getComputedStyle(subtitle)
      const subtitleMutedStyle = getComputedStyle(subtitleMuted)
      const subtitleBoldStyle = getComputedStyle(subtitleBold)
      const balanceStyle = getComputedStyle(walletBalance)
      const cryptoIcon = document.querySelector(
        '.wallets-view__crypto-icon .svg-icon'
      ) as SVGElement | null
      const balance = document.querySelector('.wallets-view__balance') as HTMLElement | null

      if (!cryptoIcon || !balance) {
        return null
      }

      const balanceWrapperStyle = getComputedStyle(balance)

      return {
        cryptoContentHeight: Number.parseFloat(contentStyle.height),
        cryptoContentJustify: contentStyle.justifyContent,
        cryptoIconWidth: cryptoIcon.getBoundingClientRect().width,
        cryptoIconHeight: cryptoIcon.getBoundingClientRect().height,
        subtitleOpacity: Number.parseFloat(subtitleStyle.opacity),
        subtitleMutedColor: subtitleMutedStyle.color,
        subtitleBoldColor: subtitleBoldStyle.color,
        balanceHeight: Number.parseFloat(balanceStyle.height),
        balanceMarginInlineEnd: Number.parseFloat(balanceWrapperStyle.marginInlineEnd),
        balanceGap: Number.parseFloat(balanceStyle.gap),
        balanceJustify: balanceStyle.justifyContent,
        balanceIsSingleLine: walletBalance.classList.contains('wallet-balance--single-line')
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.cryptoContentHeight ?? 0).toBeGreaterThanOrEqual(39)
    expect(metrics?.cryptoContentHeight ?? 999).toBeLessThanOrEqual(46)
    expect(metrics?.cryptoContentJustify).toBe('center')
    expect(metrics?.cryptoIconWidth ?? 0).toBeGreaterThanOrEqual(31)
    expect(metrics?.cryptoIconWidth ?? 99).toBeLessThanOrEqual(33)
    expect(metrics?.cryptoIconHeight ?? 0).toBeGreaterThanOrEqual(31)
    expect(metrics?.cryptoIconHeight ?? 99).toBeLessThanOrEqual(33)
    expect(metrics?.subtitleOpacity ?? 0).toBeGreaterThanOrEqual(0.99)
    expect(metrics?.subtitleMutedColor).not.toBe(metrics?.subtitleBoldColor)
    expect(metrics?.balanceHeight ?? 0).toBeGreaterThanOrEqual(39)
    expect(metrics?.balanceHeight ?? 999).toBeLessThanOrEqual(41)
    expect(metrics?.balanceMarginInlineEnd ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.balanceMarginInlineEnd ?? 99).toBeLessThanOrEqual(9)

    if (metrics?.balanceIsSingleLine) {
      expect(metrics?.balanceGap ?? 999).toBeLessThanOrEqual(1)
      expect(metrics?.balanceJustify).toBe('center')
    } else {
      expect(metrics?.balanceGap ?? 0).toBeGreaterThanOrEqual(7)
      expect(metrics?.balanceGap ?? 999).toBeLessThanOrEqual(9)
    }

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps wallets list edge-to-edge on mobile while search/footer stay on shared settings gutters', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/options/wallets')
    await expect(page).toHaveURL(/\/options\/wallets$/)
    await expect(page.locator('.wallets-view__list')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.settings-table-shell') as HTMLElement | null
      const bleed = document.querySelector('.settings-table-shell__bleed') as HTMLElement | null
      const beforeSection = document.querySelector(
        '.settings-table-shell__section'
      ) as HTMLElement | null
      const list = document.querySelector('.wallets-view__list') as HTMLElement | null

      if (!shell || !bleed || !beforeSection || !list) {
        return null
      }

      const shellStyle = getComputedStyle(shell)
      const bleedStyle = getComputedStyle(bleed)
      const beforeStyle = getComputedStyle(beforeSection)
      const listRect = list.getBoundingClientRect()

      return {
        bleedInlineStartVar: shellStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-start')
          .trim(),
        bleedInlineEndVar: shellStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-end')
          .trim(),
        marginInlineStart: Number.parseFloat(bleedStyle.marginInlineStart),
        marginInlineEnd: Number.parseFloat(bleedStyle.marginInlineEnd),
        beforePaddingInlineStart: Number.parseFloat(beforeStyle.paddingInlineStart),
        beforePaddingInlineEnd: Number.parseFloat(beforeStyle.paddingInlineEnd),
        listLeft: listRect.left,
        listRightGap: window.innerWidth - listRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.bleedInlineStartVar).not.toBe('')
    expect(metrics?.bleedInlineEndVar).not.toBe('')
    expect(metrics?.marginInlineStart ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineStart ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.marginInlineEnd ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineEnd ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.beforePaddingInlineStart ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.beforePaddingInlineEnd ?? 99).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.listLeft ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.listRightGap ?? 99)).toBeLessThanOrEqual(1)

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps wallet tab content top-aligned when fiat line is absent', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/home')
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.account-view')).toBeVisible()
    await expect(page.locator('.wallet-tab__content').first()).toBeVisible()

    const metrics = await page.evaluate(() => {
      const placeholder = document.querySelector(
        '.wallet-tab__rates-placeholder'
      ) as HTMLElement | null
      const content =
        (placeholder?.closest('.wallet-tab__content') as HTMLElement | null) ??
        (document.querySelector('.wallet-tab__content') as HTMLElement | null)
      const networkLabel = content?.querySelector(
        '.wallet-tab__network-label'
      ) as HTMLElement | null
      const rates = content?.querySelector('.wallet-tab__rates') as HTMLElement | null

      if (!content || !rates) {
        return null
      }

      const contentStyle = getComputedStyle(content)
      const placeholderStyle = placeholder ? getComputedStyle(placeholder) : null
      const networkLabelStyle = networkLabel ? getComputedStyle(networkLabel) : null
      const ratesStyle = getComputedStyle(rates)

      return {
        contentJustify: contentStyle.justifyContent,
        contentMinHeight: Number.parseFloat(contentStyle.minHeight),
        hasPlaceholder: Boolean(placeholder),
        placeholderVisibility: placeholderStyle?.visibility ?? null,
        ratesMarginTop: Number.parseFloat(ratesStyle.marginTop),
        networkLabelFontSize: networkLabelStyle
          ? Number.parseFloat(networkLabelStyle.fontSize)
          : null
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.contentJustify).toBe('flex-start')
    expect(metrics?.contentMinHeight ?? 0).toBeGreaterThanOrEqual(40)

    if (metrics?.hasPlaceholder) {
      expect(metrics?.placeholderVisibility).toBe('hidden')
    }

    expect(metrics?.ratesMarginTop ?? 0).toBeGreaterThanOrEqual(3)
    expect(metrics?.ratesMarginTop ?? 999).toBeLessThanOrEqual(5)

    if (metrics?.networkLabelFontSize !== null) {
      expect(metrics?.networkLabelFontSize ?? 0).toBeGreaterThanOrEqual(9)
      expect(metrics?.networkLabelFontSize ?? 999).toBeLessThanOrEqual(11)
    }

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps wallet tabs sizing and slider controls consistent on home', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/home')
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.account-view')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const root = document.querySelector('.account-view') as HTMLElement | null
      const tab = document.querySelector('.account-view .v-tab') as HTMLElement | null
      const tabs = document.querySelector('.account-view .v-tabs') as HTMLElement | null
      const prev = document.querySelector(
        '.account-view .v-slide-group__prev'
      ) as HTMLElement | null
      const next = document.querySelector(
        '.account-view .v-slide-group__next'
      ) as HTMLElement | null

      if (!root || !tab || !tabs) {
        return null
      }

      const rootStyle = getComputedStyle(root)
      const tabStyle = getComputedStyle(tab)
      const tabsStyle = getComputedStyle(tabs)
      const prevStyle = prev ? getComputedStyle(prev) : null
      const nextStyle = next ? getComputedStyle(next) : null

      return {
        rootTabFontSizeVar: rootStyle.getPropertyValue('--a-account-tab-font-size').trim(),
        rootAffixWidthVar: rootStyle.getPropertyValue('--a-account-tab-affix-width').trim(),
        tabFontSize: Number.parseFloat(tabStyle.fontSize),
        tabMinWidth: Number.parseFloat(tabStyle.minWidth),
        tabsPaddingTop: Number.parseFloat(tabsStyle.paddingTop),
        tabsPaddingBottom: Number.parseFloat(tabsStyle.paddingBottom),
        prevMinWidth: prevStyle ? Number.parseFloat(prevStyle.minWidth) : null,
        nextMinWidth: nextStyle ? Number.parseFloat(nextStyle.minWidth) : null
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.rootTabFontSizeVar).not.toBe('')
    expect(metrics?.rootAffixWidthVar).not.toBe('')
    expect(metrics?.tabFontSize ?? 0).toBeGreaterThanOrEqual(15)
    expect(metrics?.tabFontSize ?? 999).toBeLessThanOrEqual(17)
    expect(metrics?.tabMinWidth ?? 0).toBeGreaterThanOrEqual(83)
    expect(metrics?.tabMinWidth ?? 999).toBeLessThanOrEqual(85)
    expect(metrics?.tabsPaddingTop ?? 0).toBeGreaterThanOrEqual(9)
    expect(metrics?.tabsPaddingTop ?? 999).toBeLessThanOrEqual(11)
    expect(metrics?.tabsPaddingBottom ?? 0).toBeGreaterThanOrEqual(0)
    expect(metrics?.tabsPaddingBottom ?? 999).toBeLessThanOrEqual(2)

    if (metrics?.prevMinWidth !== null) {
      expect(metrics?.prevMinWidth ?? 0).toBeGreaterThanOrEqual(31)
      expect(metrics?.prevMinWidth ?? 999).toBeLessThanOrEqual(33)
    }

    if (metrics?.nextMinWidth !== null) {
      expect(metrics?.nextMinWidth ?? 0).toBeGreaterThanOrEqual(31)
      expect(metrics?.nextMinWidth ?? 999).toBeLessThanOrEqual(33)
    }

    await assertNoDocumentScrollLeak(page)
  })
})
