<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="t('options.nodes_list')"
      :show-back="true"
      has-spinner
      flat
      fixed
    />

    <v-container fluid class="px-0 container--with-app-toolbar">
      <v-row justify="center" no-gutters>
        <container padding>
          <NodesTable />
        </container>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import NodesTable from '@/components/nodes/NodesTable.vue'
import { nodesManager } from '@/lib/nodes'
import { onBeforeUnmount, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

const className = 'nodes-view'

const store = useStore()
const { t } = useI18n()

onMounted(() => {
  store.dispatch('nodes/updateStatus')

  nodesManager.updateHealthcheckInterval('onScreen')
})

onBeforeUnmount(() => {
  nodesManager.updateHealthcheckInterval('normal')
})
</script>

<style lang="scss" scoped>
@use 'vuetify/settings';

.nodes-view {
}

/** Themes **/
.v-theme--light {
}
</style>
