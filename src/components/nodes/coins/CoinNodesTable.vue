<template>
  <NodesTableContainer>
    <NodesTableHead hide-checkbox hide-socket />

    <tbody>
      <CoinNodesTableItem
        v-for="node in ethNodes"
        :key="node.url"
        :label="NODE_LABELS.EthNode"
        :node="node"
      />
      <CoinNodesTableItem
        v-for="node in btcNodes"
        :key="node.url"
        :label="NODE_LABELS.BtcNode"
        :node="node"
      />
      <CoinNodesTableItem
        v-for="node in dogeNodes"
        :key="node.url"
        :label="NODE_LABELS.DogeNode"
        :node="node"
      />
      <CoinNodesTableItem
        v-for="node in dashNodes"
        :key="node.url"
        :label="NODE_LABELS.DashNode"
        :node="node"
      />
      <CoinNodesTableItem
        v-for="node in lskNodes"
        :key="node.url"
        :label="NODE_LABELS.LskNode"
        :node="node"
      />
    </tbody>
  </NodesTableContainer>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import CoinNodesTableItem from './CoinNodesTableItem.vue'
import { NODE_LABELS } from '@/lib/nodes/constants'

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

    const ethNodes = computed(() => store.getters['nodes/eth'])
    const btcNodes = computed(() => store.getters['nodes/btc'])
    const dogeNodes = computed(() => store.getters['nodes/doge'])
    const dashNodes = computed(() => store.getters['nodes/dash'])
    const lskNodes = computed(() => store.getters['nodes/lsk'])

    return {
      ethNodes,
      btcNodes,
      dogeNodes,
      dashNodes,
      lskNodes,
      NODE_LABELS,
      classes
    }
  }
})
</script>

<style lang="scss" scoped></style>
