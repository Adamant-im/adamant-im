<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    :class="[
      'app-snackbar',
      { outlined: variant === 'outlined', 'app-snackbar--keyboard-visible': isKeyboardVisible }
    ]"
    :variant="variant"
    location="bottom"
    width="100%"
    :multi-line="message.length > 50"
    @click:outside="show = false"
    :style="{
      '--bottom-offset': bottomOffset
    }"
  >
    <div class="app-snackbar__container">
      {{ message }}
      <v-btn
        v-if="timeout === 0 || timeout > 2000 || timeout === -1"
        size="x-small"
        variant="text"
        fab
        @click="show = false"
      >
        <v-icon class="app-snackbar__icon" :icon="mdiClose" size="dense" />
      </v-btn>
    </div>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { mdiClose } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'

const { t } = useI18n()
const store = useStore()

const show = computed({
  get() {
    return store.state.snackbar.show
  },
  set(value: boolean) {
    if (!value) {
      store.commit('snackbar/resetOptions', value)
    }

    store.commit('snackbar/changeState', value)
  }
})
const message = computed(() => store.state.snackbar.message)
const color = computed(() => store.state.snackbar.color)
const variant = computed(() => store.state.snackbar.variant)
const timeout = computed(() =>
  message.value === t('connection.offline') ? -1 : store.state.snackbar.timeout
)

const isKeyboardVisible = ref(false)

const bottomOffset = ref('')

const adjustBottom = () => {
  if (!window.visualViewport) {
    return
  }

  const viewportHeight = window.visualViewport.height
  const fullHeight = window.innerHeight

  bottomOffset.value = viewportHeight + 'px'

  isKeyboardVisible.value = fullHeight - viewportHeight > 100
}

window.visualViewport?.addEventListener('resize', adjustBottom)
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

:global(.v-overlay-container:has(.app-snackbar--keyboard-visible)) {
  contain: unset;
}
.app-snackbar {
  &--keyboard-visible {
    :deep(.v-overlay__content) {
      bottom: var(--bottom-offset);
    }
  }

  :deep(.v-snackbar__wrapper) {
    @include mixins.a-text-regular-enlarged();

    margin: 0 auto;
    border-radius: 0;
    max-width: 300px;
    border: 1px solid transparent;
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

  &.outlined {
    :deep(.v-snackbar__wrapper) {
      border-color: map.get(colors.$adm-colors, 'danger');
    }
  }
}

.v-theme--light.app-snackbar {
  :deep(.v-snackbar__wrapper) {
    background-color: map.get(colors.$adm-colors, 'secondary');
    color: map.get(colors.$adm-colors, 'regular');
  }
}

.v-theme--dark.app-snackbar {
  :deep(.v-snackbar__wrapper) {
    background-color: map.get(colors.$adm-colors, 'regular');
    color: map.get(settings.$shades, 'white');
  }
}
</style>
