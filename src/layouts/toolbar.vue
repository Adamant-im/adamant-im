<template>
  <v-main>
    <v-container
      fluid
      :class="{
        'pa-6': !containerNoPadding,
        'pa-0': containerNoPadding
      }"
    >
      <slot />
    </v-container>
    <app-snackbar />
    <app-navigation v-if="showNavigation" />
  </v-main>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'
import AppNavigation from '@/components/AppNavigation'

export default {
  components: {
    AppSnackbar,
    AppNavigation
  },
  computed: {
    containerNoPadding () {
      return this.$route.meta.containerNoPadding
    },
    showNavigation () {
      return this.$route.meta.showNavigation || false
    }
  }
}
</script>
