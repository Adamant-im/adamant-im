<template>
  <v-table :class="classes.root">
    <nodes-table-head />

    <tbody>
      <nodes-table-item
        v-for="node in nodes"
        :key="node.name"
        :node="node"
      />
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
  setup () {
    const store = useStore()
    const nodes = computed(() => store.getters['nodes/list'])

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
@import '~vuetify/settings';

.nodes-table {
  margin-left: -24px;
  margin-right: -24px;
  max-width: unset;
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
