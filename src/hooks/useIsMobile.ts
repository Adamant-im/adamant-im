import { ref, onMounted, onUnmounted } from 'vue'
import { isMobileDevice, isNarrowMobileViewport } from '@/lib/mobileDevice'

export function useIsMobile() {
  const isMobile = ref(false)

  const checkIsMobile = () => {
    return isMobileDevice() || isNarrowMobileViewport()
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
