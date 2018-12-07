export default () => ({
  state: {
    show: false,
    message: '',
    timeout: 1500,
    color: ''
  },
  mutations: {
    changeState: jest.fn(),
    resetOptions: jest.fn()
  },
  actions: {
    show: jest.fn()
  },
  namespaced: true
})
