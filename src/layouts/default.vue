<template>
  <v-main>
    <v-container
      class="pa-6"
      fluid
      fill-height
    >
      <slot />
    </v-container>

    <app-snackbar />
  </v-main>
</template>

<script>
import AppSnackbar from '@/components/AppSnackbar'

export default {
  components: {
    AppSnackbar
  }
}
</script>
