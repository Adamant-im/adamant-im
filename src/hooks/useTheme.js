import { computed } from 'vue'
import { useStore } from 'vuex'

export function useTheme() {
  const store = useStore()

  const isDarkTheme = computed(() => store.state.options.darkTheme)
  const isLightTheme = computed(() => !store.state.options.darkTheme)

  return {
    isDarkTheme,
    isLightTheme
  }
}
