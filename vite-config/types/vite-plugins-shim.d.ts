declare module '@vitejs/plugin-vue' {
  import type { PluginOption } from 'vite'

  const vue: (...args: any[]) => PluginOption
  export default vue
}

declare module '@vitejs/plugin-vue-jsx' {
  import type { PluginOption } from 'vite'

  const vueJsx: (...args: any[]) => PluginOption
  export default vueJsx
}
