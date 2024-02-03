import throttle from 'lodash/throttle'

const updateRouteScrollPosition = throttle(function () {
  if (Object.prototype.hasOwnProperty.call(this.$route.meta, 'scrollPosition')) {
    this.$route.meta.scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    }
  }
}, 500)

export default {
  created() {
    window.addEventListener('scroll', this.$_handleScroll)
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.$_handleScroll)
  },
  methods: {
    $_handleScroll() {
      updateRouteScrollPosition.call(this)
    }
  }
}
