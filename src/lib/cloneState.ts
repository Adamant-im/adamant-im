import { toRaw } from 'vue'

/**
 * Clone Vuex state without retaining Vue proxies or references to mutable nested values.
 */
export function cloneState<T>(value: T): T {
  return structuredClone(toRaw(value))
}
