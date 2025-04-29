<template>
  <div :class="classes.root" class="w-100" ref="navigationWrapper">
    <app-toolbar-centered
      app
      :title="title"
      :has-spinner="hasSpinner"
      show-back
      flat
      sticky
      disable-max-width
    />

    <v-container
      fluid
      class="px-0 py-0"
      :class="{
        [classes.container]: true,
        [classes.containerWithLoader]: hasLoaderSlot
      }"
    >
      <v-row justify="center" no-gutters>
        <slot name="loader" />

        <container
          :padding="contentPadding"
          :class="{ [classes.content]: true }"
          disable-max-width
          v-if="readyToShow"
          @scroll="onScroll"
        >
          <slot />
        </container>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import { computed, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

type NavigationWrapperProps = {
  contentPadding?: boolean
  readyToShow?: boolean
}

const { contentPadding = true, readyToShow = true } = defineProps<NavigationWrapperProps>()

const emit = defineEmits<{
  (e: 'scroll-content', value: Event): void
}>()
const className = 'navigation-wrapper'

const classes = {
  root: className,
  container: `${className}__container`,
  containerWithLoader: `${className}__container--loader`,
  content: `${className}__content`
}

const route = useRoute()

const { t } = useI18n()

const slots = useSlots()
const hasLoaderSlot = computed(() => !!slots.loader)

const title = computed(() => {
  switch (route.name) {
    case 'Nodes':
      return t('options.nodes_list')
    case 'ExportKeys':
      return t('options.export_keys.title')
    case 'Votes':
      return t('votes.page_title')
    case 'Wallets':
      return t('options.wallets_list')
    case 'Transactions':
    case 'Transaction':
      return (route.params.txId as string) || t('transaction.transactions')
    case 'SendFunds':
      return t('transfer.page_title')

    default:
      return t('options.page_title')
  }
})

const hasSpinner = computed(() => {
  const routesWithSpinner = new Set(['Votes', 'Wallets', 'Nodes'])
  return route.name ? routesWithSpinner.has(route.name.toString()) : false
})

const onScroll = (event: Event) => {
  emit('scroll-content', event)
}
</script>

<style scoped lang="scss">
.navigation-wrapper {
  position: relative;
  height: max-content;

  &__container {
    &--loader {
      position: relative;
    }
  }
}
</style>
