<template>
  <NodesTableContainer>
    <NodesTableHead hide-socket />

    <tbody>
      <CoinNodesTableItem v-for="node in nodes" :key="node.url" :label="node.label" :node="node" />
    </tbody>
  </NodesTableContainer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import CoinNodesTableItem from './CoinNodesTableItem.vue'
import { type NodeStatusResult } from '@/lib/nodes/abstract.node'
import { sortNodesFn } from '@/components/nodes/utils/sortNodesFn'

const className = 'nodes-table'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    NodesTableContainer,
    NodesTableHead,
    CoinNodesTableItem
  },
  setup() {
    const store = useStore()

    const nodes = computed<NodeStatusResult[]>(() => {
      const arr = store.getters['nodes/coins']

      return [...arr].sort(sortNodesFn)
    })

    return {
      nodes,
      classes
    }
  }
})
</script>

<style lang="scss" scoped></style>
