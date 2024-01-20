<template>
  <div :class="classes.root">
    <v-tabs v-model="tab" bg-color="transparent">
      <v-tab value="adm">{{ $t('nodes.tabs.adm_nodes') }}</v-tab>
      <v-tab value="coins">{{ $t('nodes.tabs.coin_nodes') }}</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="adm">
        <AdmNodesTable />
      </v-window-item>

      <v-window-item value="coins">
        <CoinNodesTable />
      </v-window-item>
    </v-window>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { AdmNodesTable } from './adm'
import { CoinNodesTable } from './coins'

const className = 'nodes-table'
const classes = {
  root: className
}

type Tab = 'adm' | 'coins'

export default defineComponent({
  components: {
    AdmNodesTable,
    CoinNodesTable
  },
  setup() {
    const tab = ref<Tab>('adm')

    return {
      tab,
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';

.nodes-table {
  margin-left: -24px;
  margin-right: -24px;
  max-width: unset !important;
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .nodes-table {
    margin-left: -16px;
    margin-right: -16px;
  }
}
</style>
