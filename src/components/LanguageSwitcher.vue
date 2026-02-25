<template>
  <v-menu offset-y>
    <template #activator="{ props }">
      <v-btn
        class="ma-0 btn"
        variant="text"
        v-bind="props"
        :prepend-icon="prependIcon"
        :append-icon="appendIcon"
      >
        {{ currentLanguageName }}
      </v-btn>
    </template>

    <v-list>
      <v-list-item v-for="(language, code) in languages" :key="code" @click="onSelect(code)">
        <v-list-item-title>{{ language.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

defineProps({
  prependIcon: {
    type: String,
    default: ''
  },
  appendIcon: {
    type: String,
    default: ''
  }
})

const { messages, locale } = useI18n()
const store = useStore()

const languages = computed(() => messages.value)

const currentLocale = computed({
  get: () => store.state.language.currentLocale,
  set: (value) => {
    store.dispatch('language/changeLocale', value)
    locale.value = value
  }
})

const currentLanguageName = computed(() => languages.value[currentLocale.value]?.title || '')

const onSelect = (code) => {
  currentLocale.value = code
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
