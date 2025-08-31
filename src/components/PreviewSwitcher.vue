<template>
  <v-menu offset-y>
    <template #activator="{ props: activatorProps }">
      <v-btn
        class="ma-0 btn"
        variant="text"
        v-bind="activatorProps"
        :prepend-icon="props.prependIcon"
        :append-icon="props.appendIcon"
      >
        {{ t(currentPreference) }}
      </v-btn>
    </template>

    <v-list>
      <v-list-item
        v-for="preference in preferences"
        :key="preference"
        @click="onSelect(preference)"
      >
        <v-list-item-title>{{ t(preference) }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
import { PreviewPreferences } from '@/lib/constants'
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

type Props = {
  optionKey: string
  prependIcon?: string
  appendIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  prependIcon: '',
  appendIcon: ''
})

const { t } = useI18n()
const store = useStore()
const preferences = PreviewPreferences

const currentPreference = computed({
  get() {
    return store.state.options[props.optionKey]
  },
  set(value) {
    store.commit('options/updateOption', {
      key: props.optionKey,
      value
    })
  }
})

const onSelect = (preference: string) => {
  currentPreference.value = preference
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.btn {
  text-transform: capitalize;
  font-weight: 300;

  :deep(.v-icon) {
    margin-top: 2px;

    &:before {
      transition: 0.2s linear;
    }
  }

  &[aria-expanded='true'] {
    :deep(.v-icon) {
      transform: rotate(90deg);
    }
  }
}

/** Themes **/
.v-theme--light {
  .btn {
    color: map.get(colors.$adm-colors, 'regular');
  }
}
</style>
