/**
 * Install the function-only subset of setImmediate used by web3.
 *
 * The legacy package also accepts strings and compiles them with the Function constructor, which
 * is incompatible with a strict CSP. Web3 only passes callbacks, so rejecting strings preserves
 * the live contract without keeping a string-to-code path in the renderer.
 */
export function installSetImmediate(target) {
  if (typeof target.setImmediate === 'function') return

  let nextHandle = 1
  const timers = new Map()

  const setImmediate = (callback, ...args) => {
    if (typeof callback !== 'function') {
      throw new TypeError('setImmediate callback must be a function')
    }

    const handle = nextHandle++
    const timer = target.setTimeout(() => {
      timers.delete(handle)
      callback(...args)
    }, 0)

    timers.set(handle, timer)
    return handle
  }

  const clearImmediate = (handle) => {
    const timer = timers.get(handle)
    if (timer === undefined) return

    target.clearTimeout(timer)
    timers.delete(handle)
  }

  Object.defineProperties(target, {
    clearImmediate: { configurable: true, writable: true, value: clearImmediate },
    setImmediate: { configurable: true, writable: true, value: setImmediate }
  })
}

installSetImmediate(globalThis)
