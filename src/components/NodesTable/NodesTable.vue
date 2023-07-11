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
      return arr.sort((a, b) => {
        const alphabets = /^[a-zA-Z]+/;
        const aAlphabets = a.url.replace(/\d+/g, "");
        const bAlphabets = b.url.replace(/\d+/g, "");
        if (aAlphabets === bAlphabets) {
          const aNumber = a.url.replace(alphabets, "");
          const bNumber = b.url.replace(alphabets, "");
          const result = aNumber === bNumber ? 0 : parseInt(aNumber, 10) - parseInt(bNumber, 10);
          return result;
        }
        return aAlphabets > bAlphabets ? 1 : -1;
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
