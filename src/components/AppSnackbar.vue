<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    :class="[className, { outlined: variant === 'outlined', multiline: message.length > 50 }]"
    :variant="variant"
    location="bottom"
    width="100%"
    @click:outside="show = false"
  >
    <div :class="`${className}__container`">
      <span :class="`${className}__message`">{{ message }}</span>
      <v-btn
        v-if="timeout === 0 || timeout > 2000 || timeout === -1"
        :class="`${className}__close-button`"
        size="small"
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
const variant = computed(() => store.state.snackbar.variant || 'flat')
const timeout = computed(() =>
  message.value === t('connection.offline') ? -1 : store.state.snackbar.timeout
)
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/components/_text-content.scss' as textContent;
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.app-snackbar {
  :deep(.v-snackbar__wrapper) {
    @include textContent.a-content-body-copy();

    margin: 0 auto;
    border-radius: 0;
    max-width: var(--a-snackbar-max-width);
    border: var(--a-border-width-thin) solid transparent;
  }

  :deep(.v-snackbar__content) {
    font-size: var(--a-snackbar-content-font-size);
    line-height: var(--a-snackbar-content-line-height);
    font-weight: var(--a-font-weight-light);
  }

  &__container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--a-snackbar-content-gap);
  }

  &__message {
    flex: 1 1 auto;
    min-width: 0;
  }

  &.multiline {
    :deep(.v-snackbar__wrapper) {
      min-height: var(--a-snackbar-multiline-min-height);
    }

    .app-snackbar__container {
      align-items: flex-start;
    }
  }

  &__close-button {
    &.v-btn {
      min-width: var(--a-snackbar-close-button-size);
      padding: 0;
      width: var(--a-snackbar-close-button-size);
      height: var(--a-snackbar-close-button-size);
    }

    flex: 0 0 auto;
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
