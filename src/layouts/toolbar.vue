<template>
  <v-content>
    <v-container fluid :class="{ 'pa-0': containerNoPadding }">
      <TransitionEffect>
        <router-view />
      </TransitionEffect>
    </v-container>
    <app-snackbar/>
    <app-navigation v-if="showNavigation"/>
  </v-content>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'
import AppNavigation from '@/components/AppNavigation'
import TransitionEffect from '@/components/TransitionEffect'

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
    AppNavigation,
    TransitionEffect
  }
}
</script>
