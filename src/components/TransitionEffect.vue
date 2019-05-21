<template>
  <transition name="fade" mode="out-in">
    <slot />
  </transition>
</template>

<script>
export default {
  name: `TransitionPage`
}
</script>

<style lang="stylus" scoped>
.fade-enter-active, .fade-leave-active
  transition: opacity .25s
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
  opacity: 0
</style>
