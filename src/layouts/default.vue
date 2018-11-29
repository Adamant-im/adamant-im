<template>
  <v-app>
    <v-content>
      <v-container fluid fill-height>
        <router-view/>
      </v-container>

      <app-snackbar/>
    </v-content>
  </v-app>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'

export default {
  components: {
    AppSnackbar
  }
}
</script>

<style>
/* @todo <main> shouldn't have text-align: center by default */
main {
  text-align: left;
}
</style>
