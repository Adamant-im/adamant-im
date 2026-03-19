<template>
  <NodesTable />
</template>

<script setup lang="ts">
import NodesTable from '@/components/nodes/NodesTable.vue'
import { nodesManager } from '@/lib/nodes'
import { useStore } from 'vuex'
import { onMounted, onBeforeUnmount } from 'vue'

const store = useStore()

onMounted(() => {
  store.dispatch('nodes/updateStatus')
  // While the Nodes screen is open, poll more frequently to show fresh statuses in UI.
  nodesManager.updateHealthcheckInterval('onScreen')
})

onBeforeUnmount(() => {
  // Restore default cadence when leaving the Nodes screen.
  nodesManager.updateHealthcheckInterval('normal')
})
</script>
