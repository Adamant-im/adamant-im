<template>
  <NodesTableContainer>
    <NodesTableHead hide-label hide-socket />

    <tbody>
      <IpfsNodesTableItem v-for="node in ipfsNodes" :key="node.url" blockchain="adm" :node="node" />
    </tbody>
  </NodesTableContainer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import IpfsNodesTableItem from './IpfsNodesTableItem.vue'
import { sortNodesFn } from '@/components/nodes/utils/sortNodesFn'

const className = 'ipfs-nodes-table'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    NodesTableContainer,
    NodesTableHead,
    IpfsNodesTableItem
  },
  setup() {
    const store = useStore()
    const ipfsNodes = computed(() => {
      const arr = store.getters['nodes/ipfs']

      return [...arr].sort(sortNodesFn)
    })

    return {
      ipfsNodes,
      classes
    }
  }
})
</script>

<style lang="scss">
@import 'vuetify/settings';
</style>
