<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    :class="className"
    bottom
  >
    {{ message }}
  </v-snackbar>
</template>

<script>
export default {
  computed: {
    className: () => 'app-snackbar',
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

<style lang="stylus" scoped>
@import '../assets/stylus/settings/_colors.styl'
@import '../assets/stylus/themes/adamant/_mixins.styl'
.app-snackbar
  >>> .v-snack__wrapper
    a-text-regular-enlarged()

.theme--light
  .app-snackbar
    color: $adm-colors.regular
    >>> .v-snack__wrapper
      background-color: $adm-colors.secondary2

</style>
