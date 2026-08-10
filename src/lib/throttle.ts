type ThrottledFunction<TArgs extends unknown[], TResult> = {
  (this: unknown, ...args: TArgs): TResult | undefined
  cancel(): void
  flush(): TResult | undefined
}

/**
 * Invoke immediately, then coalesce calls made during the wait window into one trailing call.
 */
export function throttle<TArgs extends unknown[], TResult>(
  callback: (this: unknown, ...args: TArgs) => TResult,
  wait: number
): ThrottledFunction<TArgs, TResult> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastInvokeTime: number | undefined
  let pendingInvocation: { args: TArgs; context: unknown } | undefined
  let result: TResult | undefined

  const invoke = (time: number) => {
    const invocation = pendingInvocation

    pendingInvocation = undefined
    lastInvokeTime = time

    if (invocation) {
      result = callback.apply(invocation.context, invocation.args)
    }

    return result
  }

  const invokeTrailing = () => {
    timeoutId = undefined

    if (pendingInvocation) {
      invoke(Date.now())
    }
  }

  const throttled: ThrottledFunction<TArgs, TResult> = function (...args: TArgs) {
    const now = Date.now()
    const remaining = lastInvokeTime === undefined ? 0 : wait - (now - lastInvokeTime)

    pendingInvocation = { args, context: this }

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }

      return invoke(now)
    }

    if (timeoutId === undefined) {
      timeoutId = setTimeout(invokeTrailing, remaining)
    }

    return result
  }

  throttled.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    timeoutId = undefined
    lastInvokeTime = undefined
    pendingInvocation = undefined
  }

  throttled.flush = () => {
    if (timeoutId === undefined) return result

    clearTimeout(timeoutId)
    timeoutId = undefined
    return pendingInvocation ? invoke(Date.now()) : result
  }

  return throttled
}
