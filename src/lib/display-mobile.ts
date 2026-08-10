import { isMobileDevice, isNarrowMobileViewport } from '@/lib/mobileDevice'

export function isMobile(): boolean {
  return isMobileDevice() || isNarrowMobileViewport()
}
