import { onBeforeUnmount, onMounted } from 'vue'
import { useStore } from 'vuex'

const DARK_THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export function useElectronThemeSync() {
  const store = useStore()
  let mediaQuery: MediaQueryList | null = null

  const updateTheme = ({ matches }: Pick<MediaQueryList, 'matches'>) => {
    store.commit('options/updateOption', {
      key: 'darkTheme',
      value: matches
    })
  }

  onMounted(() => {
    if (!window.adamantDesktop?.isElectron) return

    mediaQuery = window.matchMedia(DARK_THEME_MEDIA_QUERY)
    mediaQuery.addEventListener('change', updateTheme)
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', updateTheme)
    mediaQuery = null
  })
}
