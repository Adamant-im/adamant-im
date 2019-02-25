const webpack = require('webpack')

module.exports = {
  pluginOptions: {

    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'i18n',
      enableInSFC: true
    },
    webpackBundleAnalyzer: {
      openAnalyzer: false
    }

  },
  configureWebpack: {
    plugins: [
      // exclude from bundle unused locales,
      // allow only those
      new webpack.ContextReplacementPlugin(
        /moment[/\\]locale$/,
        /it|de|en|fr|ru/
      ),
      // replace `config.json` for different environments
      new webpack.NormalModuleReplacementPlugin(/(.*){ENV}(.*)/, (resource) => {
        const configName = process.env.ADM_CONFIG_FILE
          ? process.env.ADM_CONFIG_FILE
          : process.env.NODE_ENV

        resource.request = resource.request.replace('{ENV}', configName)
      })
    ]
  },
  transpileDependencies: [
    '@adamant/chat',
    '@adamant/message-formatter'
  ]
}
