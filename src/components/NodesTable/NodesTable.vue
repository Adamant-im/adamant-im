<template>
  <div :class="classes.root">
    <nodes-toolbar>
      <AddCustomNode>
        <template #activator="{ props }">
          <v-btn variant="tonal" v-bind="props">Add node</v-btn>
        </template>
      </AddCustomNode>

      <EditCustomNode host="https://google.com">
        <template #activator="{ props }">
          <v-btn variant="outlined" v-bind="props">Edit</v-btn>
        </template>
      </EditCustomNode>
    </nodes-toolbar>

    <v-table :class="classes.table">
      <nodes-table-head />

      <tbody>
        <nodes-table-item v-for="node in nodes" :key="node.name" :node="node" />
      </tbody>
    </v-table>
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import NodesTableItem from '@/components/NodesTable/NodesTableItem'
import NodesTableHead from '@/components/NodesTable/NodesTableHead'
import NodesToolbar from '@/components/NodesTable/NodesToolbar.vue'
import AddCustomNode from './AddCustomNode/AddCustomNode.vue'
import EditCustomNode from './AddCustomNode/EditCustomNode.vue'

const className = 'nodes-table'
const classes = {
  root: className,
  table: `${className}__table`
}

export default defineComponent({
  components: {
    EditCustomNode,
    AddCustomNode,
    NodesToolbar,
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
  --v-table-header-height: 52px;
  margin-left: -24px;
  margin-right: -24px;

  &__table {
    max-width: unset !important;
  }
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .nodes-table {
    margin-left: -16px;
    margin-right: -16px;
  }
}

.v-theme--dark {
  .nodes-table {
    &__table {
      background-color: rgb(var(--v-theme-on-surface-variant));
    }
  }
}
</style>
