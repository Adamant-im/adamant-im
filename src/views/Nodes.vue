<template>
  <NodesTable />
</template>

<script>
import NodesTable from '@/components/nodes/NodesTable.vue'
import { nodesManager } from '@/lib/nodes'

export default {
  components: {
    NodesTable,
  },
  data: () => ({
    pagination: {
      sortBy: 'name'
    },
    timer: null
  }),
  computed: {
    className: () => 'nodes-view'
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
