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
      openAnalyzer: true
    }

  },
  configureWebpack: {
    plugins: [
      // exclude from bundle unused locales,
      // allow only those
      new webpack.ContextReplacementPlugin(
        /moment[/\\]locale$/,
        /it|de|en|fr|ru/
      )
    ]
  }
}
