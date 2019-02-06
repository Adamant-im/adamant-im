<template>
  <v-content>
    <v-container fluid :class="{ 'pa-0': containerNoPadding }">
      <transition mode="out-in" name="fade">
        <router-view />
      </transition>
    </v-container>
    <app-snackbar/>
    <app-navigation v-if="showNavigation"/>
  </v-content>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'
import AppNavigation from '@/components/AppNavigation'

export default {
  computed: {
    containerNoPadding () {
      return this.$route.meta.containerNoPadding
    },
    showNavigation () {
      return this.$route.meta.showNavigation || false
    }
  },
  components: {
    AppSnackbar,
    AppNavigation
  }
}
</script>

<style lang="stylus" scoped>
.fade-enter-active, .fade-leave-active
  transition: opacity .5s
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
  opacity: 0
</style>
