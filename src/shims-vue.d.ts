import { RouteLocationNormalizedLoaded } from 'vue-router'
import { VueI18n } from 'vue-i18n'
import type { DefineComponent } from 'vue'

declare module '*.vue' {
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $route: RouteLocationNormalizedLoaded
    $i18n: VueI18n
  }
}
