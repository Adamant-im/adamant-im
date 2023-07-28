<template>
  <v-table :class="classes.root">
    <nodes-table-head />

    <tbody>
      <nodes-table-item v-for="node in nodes" :key="node.name" :node="node" />
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
    const nodes = computed(() => {
      const arr = store.getters['nodes/list']

      return [...arr].sort((a, b) => {
        if (/^http:\/\//.test(a.url) || /^http:\/\//.test(b.url)) {
          return a.url > b.url ? -1 : b.url > a.url ? 1 : 0
        }

        return a.url > b.url ? 1 : b.url > a.url ? -1 : 0
      })
    })

    const className = 'nodes-table'
    const classes = {
      root: className
    }

    return {
      nodes,
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
