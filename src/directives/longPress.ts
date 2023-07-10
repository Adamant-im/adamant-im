import { Directive } from 'vue'

export const LONG_PRESS_TIMEOUT = 500

export const longPressDirective: Directive = {
  created: (el: HTMLElement, { value }, vNode) => {
    if (typeof value !== 'function') {
      console.warn(`Expect a function, got ${value}`)
      return
    }

    let pressTimer: NodeJS.Timeout | null = null

    const start = (e: TouchEvent) => {
      if (e.type === 'click') {
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

    el.addEventListener('touchstart', start)
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
  }
}
