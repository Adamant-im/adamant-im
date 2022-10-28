import { getStores } from '@/pinia/stores'
import { runSaga, stdChannel } from 'redux-saga'

const channel = stdChannel()

export function PiniaSagaPlugin () {
  return (context) => {
    console.log(
      'Register PiniaSagaPlugin for store:',
      context.store.$id,
      context
    )
    const { store } = context

    store.$onAction((action) => {
      console.log('$onAction', action)
      channel.put(mapPiniaActionToRedux(action))
    })
  }
}

export function registerSaga (saga, stores) {
  console.log('registerSaga', saga.name, stores)
  runSaga(
    {
      channel,
      dispatch: (action) => {
        console.log('dispatch(action)', action)

        const stores = getStores()

        const store = stores[action.store]

        if (!store) {
          throw new Error(`Store with name "${action.store}" doesn't exists`)
        }

        const actionFn = store[action.type]

        if (actionFn) {
          actionFn(action.payload)
        } else {
          console.warn(`[PiniaSaga] Saga dispatched non existing action with type "${action.type}"`, action)
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
export function mapPiniaActionToRedux (piniaAction) {
  return {
    store: piniaAction.store.$id,
    type: piniaAction.name,
    payload: piniaAction.args[0]
  }
}

export function getPiniaStoresList ($pinia) {
  return Object.keys($pinia.state.value)
}

export function mapRootState (stores) {
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
