<template>
  <v-main>
    <v-container
      fluid
      class="pa-0"
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
