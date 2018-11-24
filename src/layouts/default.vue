<template>
  <v-app>
    <v-content>
      <v-container fluid>
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
