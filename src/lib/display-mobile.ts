import { detect } from 'detect-browser'

export function isMobile(): boolean {
  const browser = detect()
  const isMobileDevice =
    browser && browser.os ? ['android', 'ios'].includes(browser.os.toLowerCase()) : false
  return isMobileDevice || window.innerWidth < 450
}
