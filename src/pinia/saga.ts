import { getStores } from '@/pinia/stores'
import { runSaga, stdChannel } from 'redux-saga'

const channel = stdChannel()

export function PiniaSagaPlugin() {
  return (context) => {
    console.log(
      'Register PiniaSagaPlugin for store:',
      context.store.$id,
      context
    )
    const { store } = context

    store.$onAction((action) => {
      const reduxAction = transformPiniaActionToReduxAction(action)
      console.log('$onAction tranform -> redux action', action, reduxAction)
      channel.put(reduxAction)
    })
  }
}

export function registerSaga(saga, stores) {
  console.log('registerSaga', saga.name, stores)
  runSaga(
    {
      channel,
      dispatch: (action) => {
        // @todo should be a common function used here and by useDispatch also
        console.log('dispatch(action)', action)

        const stores = getStores()

        const store = stores[action.store]

        if (!store) {
          console.warn(`Store with name "${action.store}" doesn't exists`)
          return
        }

        const actionFn = store[action.type]

        if (actionFn) {
          actionFn(action.payload)
        } else {
          console.warn(
            `[PiniaSaga] Saga dispatched non existing action with type "${action.type}"`,
            action
          )
        }
      },
      getState: () =>
        Object.entries(([storeName, store]) => ({
          [storeName]: store.$state
        }))
    },
    saga
  )
}

// helpers
export function transformPiniaActionToReduxAction(piniaAction) {
  return {
    store: piniaAction.store.$id,
    type: piniaAction.name,
    payload: piniaAction.args[0]
  }
}

export function getPiniaStoresList($pinia) {
  return Object.keys($pinia.state.value)
}

export function mapRootState(stores) {
  return Object.entries(stores)
    .map(([storeName, store]) => ({
      [storeName]: store.$state
    }))
    .reduce(
      (acc, curr) => ({
        ...acc,
        ...curr
      }),
      {}
    )
}
