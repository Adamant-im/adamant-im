<template>
  <v-content>
    <v-container fluid fill-height>
      <router-view/>
    </v-container>

    <app-snackbar/>
  </v-content>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'

export default {
  components: {
    AppSnackbar
  }
}
</script>
