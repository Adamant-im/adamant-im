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
  nodesManager.updateHealthcheckInterval('onScreen')
})

onBeforeUnmount(() => {
  nodesManager.updateHealthcheckInterval('normal')
})
</script>
