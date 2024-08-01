import { computed, MaybeRef, MaybeRefOrGetter, onUnmounted, unref, watch } from 'vue'

type UseIntervalOptions = {
  /**
   * Control whether the interval is enabled.
   */
  enabled?: boolean | MaybeRefOrGetter<boolean> | (() => boolean)
}

export function useInterval(
  callback: () => void,
  interval: MaybeRef<number>,
  options: UseIntervalOptions = {}
) {
  let timer: ReturnType<typeof setInterval> | null = null
  const isEnabled =
    typeof options.enabled === 'function'
      ? computed(options.enabled)
      : computed(() => unref(options.enabled))

  const start = () => {
    timer = setInterval(callback, unref(interval))
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  if (isEnabled.value) {
    start()
  }
  watch(isEnabled, (value) => {
    if (value) {
      start()
    } else {
      stop()
    }
  })

  onUnmounted(() => {
    stop()
  })
}
