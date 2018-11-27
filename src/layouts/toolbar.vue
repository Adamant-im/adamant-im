<template>
  <v-app class="application--toolbar">
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

<style>
/* @todo <main> shouldn't have text-align: center by default */
main {
  text-align: left;
}

/**
 * Equals with toolbar height.
 */
.application--toolbar {
  margin-bottom: 55px;
}
</style>
