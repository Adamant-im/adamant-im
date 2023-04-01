import { createAction } from '@/pinia/utils/createAction'
import { SNACKBAR_STORE_NAME } from './constants'

export type ShowSnackbarPayload = {
  message: string
  color?: string
  timeout?: number
}
export const showSnackbar = createAction<
  ShowSnackbarPayload,
  'showSnackbar',
  typeof SNACKBAR_STORE_NAME
>('showSnackbar', SNACKBAR_STORE_NAME)
export const changeState = createAction<
  boolean,
  'changeState',
  typeof SNACKBAR_STORE_NAME
>('changeState', SNACKBAR_STORE_NAME)
export const resetOptions = createAction<
  void,
  'resetOptions',
  typeof SNACKBAR_STORE_NAME
>('resetOptions', SNACKBAR_STORE_NAME)
