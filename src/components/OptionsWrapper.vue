<template>
  <div :class="className" class="w-100 h-100">
    <app-toolbar-centered app :title="title" show-back flat sticky disable-max-width />

    <v-container fluid class="px-0 py-0" :classes="classes">
      <v-row justify="center" no-gutters>
        <container padding :class="`${className}__content`" disable-max-width>
          <slot />
        </container>
      </v-row>
    </v-container>
  </div>
</template>
<script setup lang="ts">
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const className = 'options-wrapper'
const classes = {
  container: { [`${className}__container`]: true }
}

const route = useRoute()

const { t } = useI18n()

const title = computed(() => {
  switch (route.name) {
    case 'ExportKeys':
      return t('options.export_keys.title')
    case 'Votes':
      return t('votes.page_title')
    case 'Wallets':
      return t('options.wallets_list')
    default:
      return t('options.page_title')
  }
})
</script>

<style scoped lang="scss">
.options-wrapper {
  &__container {
    padding-top: var(--toolbar-height);
  }
}
</style>
