const MOBILE_USER_AGENT_PATTERN = /Android|BlackBerry|iPad|iPhone|iPod|IEMobile|Opera Mini/i

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  if (navigator.userAgentData?.mobile === true) {
    return true
  }

  // Android tablets report `mobile: false`, but the app has historically treated every Android
  // device as mobile. Preserve that layout contract unless product UX decides otherwise.
  return MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent)
}

export function isNarrowMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 450
}
