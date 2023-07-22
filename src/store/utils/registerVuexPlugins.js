export function registerVuexPlugins(store, plugins) {
  plugins.forEach((pluginFn) => pluginFn(store))
}
