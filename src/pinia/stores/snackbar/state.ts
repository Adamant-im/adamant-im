import { SNACKBAR_TIMEOUT } from "./constants";

export interface SnackbarState {
  open: boolean
  message: string
  timeout: number
  color: string
}

export const initialState: SnackbarState = {
  open: false,
  message: '',
  timeout: SNACKBAR_TIMEOUT,
  color: ''
}
