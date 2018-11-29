<template>
  <v-app>
    <v-content>
      <v-container fluid>
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
  components: {
    AppSnackbar,
    AppNavigation
  }
}
</script>

<style>
/* @todo <main> shouldn't have text-align: center by default */
main {
  text-align: left;
}
</style>
