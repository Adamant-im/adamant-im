<template>
  <v-menu offset-y :class="className">
    <template #activator="{ props }">
      <v-btn
        :class="[`${className}__button`, 'a-switcher-button']"
        variant="text"
        v-bind="props"
        :prepend-icon="prependIcon"
        :append-icon="appendIcon"
      >
        {{ currentLanguageName }}
      </v-btn>
    </template>

    <v-list :class="`${className}__list`">
      <v-list-item
        v-for="(language, code) in languages"
        :key="code"
        :class="`${className}__item`"
        @click="onSelect(code)"
      >
        <v-list-item-title :class="`${className}__item-title`">
          {{ language.title }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

const className = 'language-switcher'

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
@use '@/assets/styles/components/_switcher-menu.scss' as switcherMenu;

.language-switcher {
  @include switcherMenu.a-switcher-menu();
}
</style>
