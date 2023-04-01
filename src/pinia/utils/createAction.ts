import { IfVoid } from '../utils/tsHelpers'

export interface ActionWithPayload<T, P, S> {
  type: T
  payload: P
  store: S
}

export interface ActionWithoutPayload<T, S> {
  type: T
  store: S
}

export type Action<T, P, S> = IfVoid<
  P,
  ActionWithoutPayload<T, S>,
  ActionWithPayload<T, P, S>
>

export interface ActionCreator<T, P, S> {
  (payload: P): Action<T, P, S>
  store: S
  type: T
  toString(): T
}

export function createAction<
  P = void,
  T extends string = string,
  S extends string = string
>(type: T, storeName: S): ActionCreator<T, P, S> {
  function actionCreator(payload: P) {
    return {
      type,
      payload,
      store: storeName
    }
  }

  actionCreator.type = type
  actionCreator.toString = () => type
  actionCreator.store = storeName

  return actionCreator
}
