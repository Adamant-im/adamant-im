<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    :class="[className, { outlined: variant === 'outlined' }]"
    :variant="variant"
    location="bottom"
    width="100%"
    :multi-line="message.length > 50"
    @click:outside="show = false"
  >
    <div :class="`${className}__container`">
      {{ message }}
      <v-btn
        v-if="timeout === 0 || timeout > 2000 || timeout === -1"
        size="x-small"
        variant="text"
        fab
        @click="show = false"
      >
        <v-icon :class="`${className}__icon`" :icon="mdiClose" size="dense" />
      </v-btn>
    </div>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { mdiClose } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useStore } from 'vuex'

const className = 'app-snackbar'

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
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.app-snackbar {
  :deep(.v-overlay__content) {
    bottom: calc(var(--v-layout-bottom, 0px) + env(safe-area-inset-bottom, 0px) + 16px);

    @media (max-width: 768px) {
      bottom: calc(
        100dvh - 80dvh + var(--v-layout-bottom, 0px) + env(safe-area-inset-bottom, 0px) + 16px
      );
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
    background-color: map.get(settings.$shades, 'white');
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
