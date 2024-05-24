import { Ref } from 'vue'

interface UseThemeResult {
  isDarkTheme: Ref<boolean>
  isLightTheme: Ref<boolean>
}

export function useTheme(): UseThemeResult
