<template>
  <div :class="className" class="w-100 h-100">
    <app-toolbar-centered app :title="title" show-back flat sticky no-max-width />

    <v-container fluid class="px-0 py-0 container--with-app-toolbar">
      <v-row justify="center" no-gutters>
        <container padding :class="`${className}__content`" no-max-width>
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

const route = useRoute()

const { t } = useI18n()

const title = computed(() => {
  if (route.name === 'ExportKeys') {
    return t('options.export_keys.title')
  }

  if (route.name === 'Votes') {
    return t('votes.page_title')
  }

  if (route.name === 'Wallets') {
    return t('options.wallets_list')
  }

  return t('options.page_title')
})
</script>

<style scoped lang="scss">
.options-wrapper {
  position: relative;

  //&__content {
  //  overflow-y: auto;
  //  height: calc(100vh - var(--v-layout-bottom) - var(--toolbar-height));
  //}
}
</style>
