const MOBILE_USER_AGENT_PATTERN = /Android|BlackBerry|iPad|iPhone|iPod|IEMobile|Opera Mini/i

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  if (typeof navigator.userAgentData?.mobile === 'boolean') {
    return navigator.userAgentData.mobile
  }

  return MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent)
}

export function isNarrowMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 450
}
