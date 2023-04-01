import { defineStore, DefineStoreOptions } from 'pinia'
import { initialState, SnackbarState } from './state'
import {
  ShowSnackbarPayload,
  showSnackbar,
  changeState,
  resetOptions
} from './actions'
import { SNACKBAR_TIMEOUT } from './constants'
import { SnackbackActions } from './types'
import { ActionRecord } from './types'

type StoreOptions = DefineStoreOptions<
  'snackbar',
  SnackbarState,
  {},
  ActionRecord
>

export const useSnackbarStore = defineStore<
  'snackbar',
  SnackbarState,
  {},
  ActionRecord
>({
  id: 'snackbar',
  state: () => ({
    ...initialState
  }),
  getters: {},
  actions: {
    [showSnackbar.type]: function (options) {
      this.message = options.message
      this.color = options.color || ''
      this.timeout = options.timeout || 0

      this.open = true
    },
    [changeState.type]: function (open) {
      this.open = open
    },
    [resetOptions.type]: function () {
      this.message = initialState.message
      this.timeout = initialState.timeout
      this.color = initialState.color
    }
  }
})
