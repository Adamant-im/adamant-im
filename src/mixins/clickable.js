export default {
  computed: {
    /**
     * Returns true if component has `@click` listener.
     * @returns {boolean}
     */
    isClickable () {
      const listeners = Object.keys(this.$listeners)
      const hasClickAttr = listeners.some(
        listener => /^click/.test(listener)
      )

      return hasClickAttr
    }
  }
}
