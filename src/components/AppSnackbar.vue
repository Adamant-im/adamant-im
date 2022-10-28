<template>
  <v-snackbar
    v-model="open"
    :timeout="timeout"
    :color="color"
    :class="className"
    bottom
    :multi-line="message.length > 50"
  >
    <div :class="`${className}__container`">
      {{ hello }}
      {{ message }}
      <v-btn
        v-if="timeout === 0 || timeout > 2000"
        x-small
        text
        fab
        @click="open = false"
      >
        <v-icon
          :class="`${className}__icon`"
          size="20"
        >
          mdi-close
        </v-icon>
      </v-btn>
    </div>
  </v-snackbar>
</template>

<script>
import { useSnackbarStore } from '@/pinia/stores/snackbar/snackbar'
import { useTodoStore } from '@/pinia/stores/todo'
import { computed } from 'vue'

export default {
  setup () {
    const snackbar = useSnackbarStore()
    const todo = useTodoStore()
    console.log('useTodoStore', todo)
    const { resetOptions, changeState } = snackbar

    const open = computed({
      get () {
        return snackbar.open
      },
      set (newValue) {
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
      hello: computed(() => snackbar.hello),
      open
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/styles/themes/adamant/_mixins.scss';
@import '../assets/styles/settings/_colors.scss';

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
