import { Directive } from 'vue'

export const LONG_PRESS_TIMEOUT = 500

export const longPressDirective: Directive = {
  created: (el, { value }, vNode) => {
    if (typeof value !== 'function') {
      console.warn(`Expect a function, got ${value}`)
      return
    }

    let pressTimer = null

    const start = (e) => {
      if (e.type === 'click' && e.button !== 0) {
        return
      }

      if (pressTimer === null) {
        pressTimer = setTimeout(() => value(e), LONG_PRESS_TIMEOUT)
      }
    }

    const cancel = () => {
      if (pressTimer !== null) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }

    ;['touchstart'].forEach((e) => el.addEventListener(e, start))
    ;['touchend', 'touchcancel'].forEach((e) => el.addEventListener(e, cancel))
  }
}
