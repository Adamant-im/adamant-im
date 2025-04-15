<template>
  <NodesTable />
</template>

<script>
import NodesTable from '@/components/nodes/NodesTable.vue'
import { nodesManager } from '@/lib/nodes'

export default {
  components: {
    NodesTable
  },
  mounted() {
    this.$store.dispatch('nodes/updateStatus')

    nodesManager.updateHealthcheckInterval('onScreen')
  },
  beforeUnmount() {
    nodesManager.updateHealthcheckInterval('normal')
  }
}
</script>
