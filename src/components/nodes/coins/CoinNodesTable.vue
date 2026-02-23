<template>
  <NodesTableContainer>
    <NodesTableHead
      v-model="isAllNodesChecked"
      :indeterminate="isPartiallyChecked"
      hide-socket
      :label="t('nodes.coin')"
    />

    <tbody>
      <CoinNodesTableItem
        v-for="node in nodes"
        :key="node.url"
        :label="node.label"
        :node="node"
        @show-http-info="showHttpInfo = true"
      />
    </tbody>
  </NodesTableContainer>

  <HttpProtocolInfoDialog v-model="showHttpInfo" />
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import HttpProtocolInfoDialog from '@/components/nodes/components/HttpProtocolInfoDialog.vue'
import CoinNodesTableItem from './CoinNodesTableItem.vue'
import { type NodeStatusResult } from '@/lib/nodes/abstract.node'
import { sortCoinNodesFn } from '@/components/nodes/utils/sortNodesFn'

const className = 'nodes-table'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    NodesTableContainer,
    NodesTableHead,
    HttpProtocolInfoDialog,
    CoinNodesTableItem
  },
  setup() {
    const { t } = useI18n()
    const store = useStore()
    const showHttpInfo = ref(false)

    const nodes = computed<NodeStatusResult[]>(() => {
      const arr = store.getters['nodes/coins']

      return [...arr].sort(sortCoinNodesFn)
    })

    const isAllNodesChecked = computed({
      get() {
        return nodes.value.every((node) => node.active)
      },
      set(value) {
        store.dispatch('nodes/toggleAll', { nodesType: 'coins', active: value })
      }
    })

    const isPartiallyChecked = computed(() => {
      return nodes.value.some((node) => node.active) && nodes.value.some((node) => !node.active)
    })

    return {
      t,
      nodes,
      classes,
      isAllNodesChecked,
      isPartiallyChecked,
      showHttpInfo
    }
  }
})
</script>

<style lang="scss" scoped></style>
