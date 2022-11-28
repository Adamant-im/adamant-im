<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    :class="className"
    bottom
    :multi-line="message.length > 50"
  >
    <div :class="`${className}__container`">
      {{ message }}
      <v-btn
        v-if="timeout === 0 || timeout > 2000"
        size="x-small"
        variant="text"
        fab
        @click="show = false"
      >
        <v-icon
          :class="`${className}__icon`"
          icon="mdi-close"
          size="dense"
        />
      </v-btn>
    </div>
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

<style lang="scss" scoped>
@import "../assets/styles/themes/adamant/_mixins.scss";
@import "../assets/styles/settings/_colors.scss";

.app-snackbar {
  :deep(.v-snack__wrapper) {
    @include a-text-regular-enlarged();
  }

  &__container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__close-button {
    min-width: unset;
    padding: 0;
    width: 36px;
  }
}
</style>
