import { detect } from 'detect-browser'
import { ref, onMounted, onUnmounted } from 'vue'

export function useIsMobile() {
  const isMobile = ref(false)

  const checkIsMobile = () => {
    const browser = detect()
    const isMobileDevice =
      browser && browser.os
        ? ['android os', 'ios', 'blackberry os'].includes(browser.os.toLowerCase())
        : false
    return isMobileDevice || window.innerWidth < 450
  }

  const handleResize = () => {
    isMobile.value = checkIsMobile()
  }

  onMounted(() => {
    isMobile.value = checkIsMobile()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return isMobile
}
