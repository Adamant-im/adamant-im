import * as actions from './actions'

export type SnackbackActions = typeof actions
export type SnackbackAction<
  K extends keyof SnackbackActions = keyof SnackbackActions
> = ReturnType<SnackbackActions[K]>

export type ActionRecord = {
  [K in keyof SnackbackActions]: (
    payload: Parameters<SnackbackActions[K]>[0]
  ) => void
}

export type ActionRecord2 = {
  [K in keyof SnackbackActions]: SnackbackActions[K]
}
