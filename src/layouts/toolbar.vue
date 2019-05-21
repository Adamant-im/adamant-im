<template>
  <v-content>
    <v-container fluid :class="{ 'pa-0': containerNoPadding }">
      <slot/>
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
