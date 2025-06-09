import { useDisplay } from 'vuetify'
import { computed } from 'vue'

export const useScreenSize = () => {
  const { width } = useDisplay()

  const isMobileView = computed(() => width.value < 800)

  return {
    isMobileView
  }
}
