<template>
  <v-app>
    <v-content>
      <v-container fluid>
        <router-view/>
      </v-container>

      <app-toolbar/>
      <app-snackbar/>
    </v-content>
  </v-app>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'
import AppToolbar from '@/components/AppToolbar'

export default {
  components: {
    AppSnackbar,
    AppToolbar
  }
}
</script>
