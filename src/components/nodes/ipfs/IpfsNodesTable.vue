<template>
  <NodesTableContainer>
    <NodesTableHead
      v-model="isAllNodesChecked"
      :indeterminate="isPartiallyChecked"
      hide-label
      hide-socket
    />

    <tbody>
      <IpfsNodesTableItem
        v-for="node in ipfsNodes"
        :key="node.url"
        blockchain="adm"
        :node="node"
        @show-http-info="showHttpInfo = true"
      />
    </tbody>
  </NodesTableContainer>

  <HttpProtocolInfoDialog v-model="showHttpInfo" />
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import HttpProtocolInfoDialog from '@/components/nodes/components/HttpProtocolInfoDialog.vue'
import IpfsNodesTableItem from './IpfsNodesTableItem.vue'
import { type NodeStatusResult } from '@/lib/nodes/abstract.node'
import { sortNodesFn } from '@/components/nodes/utils/sortNodesFn'

const className = 'ipfs-nodes-table'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    NodesTableContainer,
    NodesTableHead,
    HttpProtocolInfoDialog,
    IpfsNodesTableItem
  },
  setup() {
    const store = useStore()
    const showHttpInfo = ref(false)
    const ipfsNodes = computed(() => {
      const arr = store.getters['nodes/ipfs']

      return [...arr].sort(sortNodesFn)
    })

    const nodes = computed<NodeStatusResult[]>(() => {
      const arr = store.getters['nodes/ipfs']

      return [...arr].sort(sortNodesFn)
    })

    const isAllNodesChecked = computed({
      get() {
        return nodes.value.every((node) => node.active)
      },
      set(value) {
        store.dispatch('nodes/toggleAll', { nodesType: 'ipfs', active: value })
      }
    })

    const isPartiallyChecked = computed(() => {
      return nodes.value.some((node) => node.active) && nodes.value.some((node) => !node.active)
    })

    return {
      ipfsNodes,
      classes,
      isAllNodesChecked,
      isPartiallyChecked,
      showHttpInfo
    }
  }
})
</script>

<style lang="scss">
@use 'vuetify/settings';
</style>
