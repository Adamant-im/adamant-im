import { getStores } from '../stores'
import { Action } from './createAction'
import { AppAction } from '../stores/types/types'
import { ActionRecord2 } from '../stores/snackbar/types'
import { SnackbackActions } from '../stores/snackbar/types'

type Stores = ReturnType<typeof getStores>
type StoreName = keyof Stores

export function useDispatch<
  A extends AppAction = AppAction,
  AN extends keyof SnackbackActions = keyof SnackbackActions
>() {
  const stores = getStores()

  return (action: ActionRecord2[keyof ActionRecord2]) => {
    const store = stores[action.store]

    if ('payload' in action) {
      store[action.type](action.payload)
    } else {
      store[action.type]()
    }
  }
}
