<template>
  <v-container fluid class="pa-0">
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
