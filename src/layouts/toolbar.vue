<template>
  <v-app>
    <v-content>
      <v-container fluid :class="{ 'pa-0': containerNoPadding }">
        <router-view/>
      </v-container>

      <app-snackbar/>
    </v-content>

    <app-navigation/>
  </v-app>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'
import AppNavigation from '@/components/AppNavigation'

export default {
  computed: {
    containerNoPadding () {
      return this.$route.meta.containerNoPadding
    }
  },
  components: {
    AppSnackbar,
    AppNavigation
  }
}
</script>
