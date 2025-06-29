import { useDisplay } from 'vuetify'
import { computed } from 'vue'

const MOBILE_BREAKPOINT = 768

export const useScreenSize = () => {
  const { width } = useDisplay()
  const isMobileView = computed(() => width.value < MOBILE_BREAKPOINT)

  return {
    isMobileView
  }
}
