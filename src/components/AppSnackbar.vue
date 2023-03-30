<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    :class="className"
    variant="elevated"
    location="bottom"
    width="100%"
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
@import 'vuetify/settings';
@import "../assets/styles/themes/adamant/_mixins.scss";
@import "../assets/styles/settings/_colors.scss";

.app-snackbar {
  :deep(.v-snackbar__wrapper) {
    @include a-text-regular-enlarged();

    margin: 0 auto;
    border-radius: 0;
    max-width: 300px;
  }

  :deep(.v-snackbar__content) {
    font-size: 16px;
    font-weight: 300;
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

.v-theme--light.app-snackbar {
  :deep(.v-snackbar__wrapper) {
    background-color: map-get($shades, 'white');
    color: map-get($adm-colors, 'regular')
  }
}

.v-theme--dark.app-snackbar {
  :deep(.v-snackbar__wrapper) {
    background-color: map-get($adm-colors, 'regular');
    color: map-get($shades, 'white');
  }
}
</style>
