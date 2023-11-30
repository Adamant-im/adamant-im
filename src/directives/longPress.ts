import { Directive } from 'vue'

export const LONG_PRESS_TIMEOUT = 500

export const longPressDirective: Directive = {
  created: (el: HTMLElement, { value }) => {
    if (typeof value !== 'function') {
      console.warn(`Expect a function, got ${value}`)
      return
    }

    const startX = 0 // mouse x position when timer started
    const startY = 0 // mouse y position when timer started
    const maxDiffX = 10 // max number of X pixels the mouse can move during long press before it is canceled
    const maxDiffY = 10 // max number of Y pixels the mouse can move during long press before it is canceled

    let pressTimer: NodeJS.Timeout | null = null

    const clearLongPressTimer = () => {
      if (pressTimer !== null) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }

    const start = (e: TouchEvent) => {
      if (e.type === 'click') {
        return
      }

      if (pressTimer === null) {
        pressTimer = setTimeout(() => {
          value(e)
          pressTimer = null
        }, LONG_PRESS_TIMEOUT)
      }
    }

    /**
     * If the mouse moves n pixels during long-press, cancel the timer
     */
    const touchMove = (e: TouchEvent) => {
      const coordinates = e.touches[0]

      // calculate total number of pixels the pointer has moved
      const diffX = Math.abs(startX - coordinates.clientX)
      const diffY = Math.abs(startY - coordinates.clientY)

      // if pointer has moved more than allowed, cancel the long-press timer and therefore the event
      if (diffX >= maxDiffX || diffY >= maxDiffY) {
        clearLongPressTimer()
      }
    }

    const cancel = () => {
      clearLongPressTimer()
    }

    el.addEventListener('touchstart', start)
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
    el.addEventListener('touchmove', touchMove)
  }
}
