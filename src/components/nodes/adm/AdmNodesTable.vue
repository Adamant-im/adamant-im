<template>
  <SettingsDataTable>
    <NodesTableHead v-model="isAllNodesChecked" :indeterminate="isPartiallyChecked" />

    <tbody>
      <AdmNodesTableItem
        v-for="node in admNodes"
        :key="node.url"
        blockchain="adm"
        :node="node"
        @show-http-info="showHttpInfo = true"
      />
    </tbody>
  </SettingsDataTable>

  <HttpProtocolInfoDialog v-model="showHttpInfo" />
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import SettingsDataTable from '@/components/common/SettingsDataTable.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import HttpProtocolInfoDialog from '@/components/nodes/components/HttpProtocolInfoDialog.vue'
import AdmNodesTableItem from './AdmNodesTableItem.vue'
import { sortNodesFn } from '@/components/nodes/utils/sortNodesFn'

export default defineComponent({
  components: {
    SettingsDataTable,
    NodesTableHead,
    HttpProtocolInfoDialog,
    AdmNodesTableItem
  },
  setup() {
    const store = useStore()

    const admNodes = computed(() => {
      const arr = store.getters['nodes/adm']

      return [...arr].sort(sortNodesFn)
    })
    const showHttpInfo = ref(false)

    const isAllNodesChecked = computed({
      get() {
        return admNodes.value.every((node) => node.active)
      },
      set(value) {
        store.dispatch('nodes/toggleAll', { nodesType: 'adm', active: value })
      }
    })

    const isPartiallyChecked = computed(() => {
      return (
        admNodes.value.some((node) => node.active) && admNodes.value.some((node) => !node.active)
      )
    })

    return {
      admNodes,
      isAllNodesChecked,
      showHttpInfo,
      isPartiallyChecked
    }
  }
})
</script>

<style lang="scss"></style>
