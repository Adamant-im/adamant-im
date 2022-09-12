import { SNACKBAR_TIMEOUT } from '@/store/modules/snackbar/constants';

export default () => ({
  state: {
    show: false,
    message: '',
    timeout: SNACKBAR_TIMEOUT,
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
