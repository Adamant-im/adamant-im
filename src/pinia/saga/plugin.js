export function PiniaTestPlugin (context) {
  const { store } = context

  store.$onAction((action) => {
    console.log('store action', action)

    if (action.name === 'show') {
      console.log('runSaga(saga)', action.args[0])
      runSaga(saga)
    }
  })
}

async function runSaga (saga) {
  const generator = saga()

  for (const value of generator) {
    if (value instanceof Promise) {
      console.log('Generator value is a Promise. Await it...')
      await value
    }
  }

  console.log('generator.end')
}

function * saga () {
  yield put({
    type: 'action1',
    payload: 'payload1'
  })
  console.log('start delay 5000')
  yield delay(5000)
  console.log('end delay end')
  yield put({
    type: 'action2',
    payload: 'payload2'
  })
}

function delay (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function put (action) {
  console.log('dispatch action', action)

  return action
}
