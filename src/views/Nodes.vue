<template>
  <div :class="className">
    <app-toolbar-centered app :title="$t('options.nodes_list')" :show-back="true" flat fixed />

    <v-container fluid class="px-0 container--with-app-toolbar">
      <v-row justify="center" no-gutters>
        <container padding>
          <NodesTable />
        </container>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import AppToolbarCentered from '@/components/AppToolbarCentered.vue'
import NodesTable from '@/components/nodes/NodesTable.vue'
import { nodesManager } from '@/lib/nodes'

export default {
  components: {
    NodesTable,
    AppToolbarCentered
  },
  data: () => ({
    pagination: {
      sortBy: 'name'
    },
    timer: null
  }),
  computed: {
    className: () => 'nodes-view'
  },
  mounted() {
    // TODO: probably it can be refactored later
    window.scrollTo(0, 0)
    this.$store.dispatch('nodes/updateStatus')

    nodesManager.updateHealthcheckInterval('onScreen')
  },
  beforeUnmount() {
    nodesManager.updateHealthcheckInterval('normal')
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';

.nodes-view {
}

/** Themes **/
.v-theme--light {
}
</style>
