<template>
  <v-app :dark="isDarkTheme">
    <v-content>
      <v-container fluid class="pa-0">
        <router-view/>
      </v-container>

      <app-snackbar/>
    </v-content>
  </v-app>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'

export default {
  computed: {
    isDarkTheme () {
      return this.$store.state.options.darkTheme
    }
  },
  components: {
    AppSnackbar
  }
}
</script>
