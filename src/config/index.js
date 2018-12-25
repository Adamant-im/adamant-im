const environment = process.env.NODE_ENV
const config = environment === 'development'
  ? require('./dev')
  : environment === 'test'
    ? require('./test')
    : require('./prod')

export default config
