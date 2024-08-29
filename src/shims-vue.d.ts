import { RouteLocationNormalizedLoaded } from 'vue-router'
import { VueI18n } from 'vue-i18n'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $route: RouteLocationNormalizedLoaded
    $i18n: VueI18n
  }
}
