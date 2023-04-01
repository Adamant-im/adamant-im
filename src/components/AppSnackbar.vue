<template>
  <v-snackbar
    v-model="open"
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
        @click="open = false"
      >
        <v-icon :class="`${className}__icon`" icon="mdi-close" size="dense" />
      </v-btn>
    </div>
  </v-snackbar>
</template>

<script lang="ts">
import { useSnackbarStore } from '@/pinia/stores/snackbar/snackbar'
import { useTodoStore } from '@/pinia/stores/todo'
import { computed } from 'vue'

export default {
  setup() {
    const snackbar = useSnackbarStore()
    const { resetOptions, changeState } = snackbar

    const open = computed({
      get() {
        return snackbar.open
      },
      set(newValue) {
        if (!newValue) {
          resetOptions()
        }

        changeState(newValue)
      }
    })

    return {
      className: 'app-snackbar',
      message: computed(() => snackbar.message),
      color: computed(() => snackbar.color),
      timeout: computed(() => snackbar.timeout),
      open
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
@import '../assets/styles/themes/adamant/_mixins.scss';
@import '../assets/styles/settings/_colors.scss';

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
    color: map-get($adm-colors, 'regular');
  }
}

.v-theme--dark.app-snackbar {
  :deep(.v-snackbar__wrapper) {
    background-color: map-get($adm-colors, 'regular');
    color: map-get($shades, 'white');
  }
}
</style>
