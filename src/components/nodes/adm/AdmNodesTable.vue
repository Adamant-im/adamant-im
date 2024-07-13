<template>
  <NodesTableContainer>
    <NodesTableHead />

    <tbody>
      <AdmNodesTableItem v-for="node in admNodes" :key="node.url" blockchain="adm" :node="node" />
    </tbody>
  </NodesTableContainer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import AdmNodesTableItem from './AdmNodesTableItem.vue'
import { sortNodesFn } from '@/components/nodes/utils/sortNodesFn'

const className = 'adm-nodes-table'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    NodesTableContainer,
    NodesTableHead,
    AdmNodesTableItem
  },
  setup() {
    const store = useStore()
    const admNodes = computed(() => {
      const arr = store.getters['nodes/adm']

      return [...arr].sort(sortNodesFn)
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
