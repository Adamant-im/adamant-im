<template>
  <v-app>
    <v-content>
      <v-container fluid :class="{ 'pa-0': containerNoPadding }">
        <router-view/>
      </v-container>

      <app-snackbar/>
    </v-content>

    <app-navigation v-if="showNavigation"/>
  </v-app>
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
