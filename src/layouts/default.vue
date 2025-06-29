<template>
  <v-container class="pa-4" fluid fill-height>
    <slot />
  </v-container>

  <app-snackbar />
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar.vue'

export default {
  components: {
    AppSnackbar
  }
}
</script>
