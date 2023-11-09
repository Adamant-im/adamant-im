<template>
  <NodesTableContainer>
    <NodesTableHead hide-checkbox hide-socket />

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
import { NODE_LABELS } from '@/lib/nodes/constants'
import { type NodeStatusResult } from '@/lib/nodes/abstract.node'

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

    const nodes = computed<NodeStatusResult[]>(() => store.getters['nodes/coins'])

    return {
      nodes,
      NODE_LABELS,
      classes
    }
  }
})
</script>

<style lang="scss" scoped></style>
