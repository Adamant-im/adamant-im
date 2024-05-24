<template>
  <v-main>
    <slot />

    <app-snackbar />
    <app-navigation v-if="showNavigation" />
  </v-main>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppNavigation from '@/components/AppNavigation.vue'

export default {
  components: {
    AppSnackbar,
    AppNavigation
  },
  computed: {
    showNavigation() {
      return this.$route.meta.showNavigation || false
    }
  }
}
</script>
