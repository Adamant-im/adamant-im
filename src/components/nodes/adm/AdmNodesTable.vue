<template>
  <NodesTable>
    <NodesTableHead hide-label />

    <tbody>
      <AdmNodesTableItem v-for="node in admNodes" :key="node.url" blockchain="adm" :node="node" />
    </tbody>
  </NodesTable>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import NodesTable from '@/components/nodes/components/NodesTable.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import AdmNodesTableItem from './AdmNodesTableItem.vue'

const className = 'adm-nodes-table'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    NodesTable,
    NodesTableHead,
    AdmNodesTableItem
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

    return {
      admNodes,
      classes
    }
  }
})
</script>

<style lang="scss">
@import 'vuetify/settings';

.adm-nodes-table {
}
</style>
