module.exports = {
  presets: [
    [
      '@vue/app',
      {
        useBuiltIns: 'entry'
      }
    ]
  ],
  env: {
    test: {
      plugins: ['rewire']
    }
  }
}
