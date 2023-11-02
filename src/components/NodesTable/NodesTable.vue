<template>
  <v-table :class="classes.root">
    <nodes-table-head />

    <tbody>
      <nodes-table-item v-for="node in admNodes" :key="node.url" blockchain="adm" :node="node" />
      <nodes-table-item v-for="node in ethNodes" :key="node.url" blockchain="eth" :node="node" />
      <nodes-table-item v-for="node in btcNodes" :key="node.url" blockchain="btc" :node="node" />
      <nodes-table-item v-for="node in dogeNodes" :key="node.url" blockchain="doge" :node="node" />
      <nodes-table-item v-for="node in dashNodes" :key="node.url" blockchain="dash" :node="node" />
      <nodes-table-item v-for="node in lskNodes" :key="node.url" blockchain="lsk" :node="node" />
    </tbody>
  </v-table>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import NodesTableItem from '@/components/NodesTable/NodesTableItem'
import NodesTableHead from '@/components/NodesTable/NodesTableHead'

export default defineComponent({
  components: {
    NodesTableHead,
    NodesTableItem
  },
  setup() {
    const store = useStore()
    const admNodes = computed(() => {
      const arr = store.getters['nodes/adm']

      return [...arr].sort((a, b) => {
        if (/^http:\/\//.test(a.url) || /^http:\/\//.test(b.url)) {
          return a.url > b.url ? -1 : b.url > a.url ? 1 : 0
        }

        return a.url > b.url ? 1 : b.url > a.url ? -1 : 0
      })
    })
    const ethNodes = computed(() => store.getters['nodes/eth'])
    const btcNodes = computed(() => store.getters['nodes/btc'])
    const dogeNodes = computed(() => store.getters['nodes/doge'])
    const dashNodes = computed(() => store.getters['nodes/dash'])
    const lskNodes = computed(() => store.getters['nodes/lsk'])

    const className = 'nodes-table'
    const classes = {
      root: className
    }

    return {
      admNodes,
      ethNodes,
      btcNodes,
      dogeNodes,
      dashNodes,
      lskNodes,
      classes
    }
  }
})
</script>

<style lang="scss">
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

.v-theme--dark {
  .nodes-table {
    background-color: rgb(var(--v-theme-on-surface-variant));
  }
}
</style>
