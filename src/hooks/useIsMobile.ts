import { detect } from 'detect-browser'
import { ref, onMounted, onUnmounted } from 'vue'

export function useIsMobile() {
  const isMobile = ref(false)

  function isMobileCheck() {
    const browser = detect()
    const isMobileDevice =
      browser && browser.os ? ['android', 'ios'].includes(browser.os.toLowerCase()) : false
    return isMobileDevice || window.innerWidth < 450
  }

  function handleResize() {
    isMobile.value = isMobileCheck()
  }

  onMounted(() => {
    isMobile.value = isMobileCheck()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return isMobile
}
