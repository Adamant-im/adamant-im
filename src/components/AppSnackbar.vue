<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    bottom
  >
    {{ message }}
  </v-snackbar>
</template>

<script>
export default {
  computed: {
    show: {
      get () {
        return this.$store.state.snackbar.show
      },
      set (value) {
        if (!value) {
          this.$store.commit('snackbar/resetOptions', value)
        }

        this.$store.commit('snackbar/changeState', value)
      }
    },
    message () {
      return this.$store.state.snackbar.message
    },
    color () {
      return this.$store.state.snackbar.color
    },
    timeout () {
      return this.$store.state.snackbar.timeout
    }
  }
}
</script>
