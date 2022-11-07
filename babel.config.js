module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
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
