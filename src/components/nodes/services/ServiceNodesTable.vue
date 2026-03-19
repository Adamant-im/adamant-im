<template>
  <SettingsDataTable>
    <NodesTableHead
      v-model="isAllNodesChecked"
      :indeterminate="isPartiallyChecked"
      hide-socket
      :label="t('nodes.service')"
    />

    <tbody>
      <ServiceNodesTableItem
        v-for="node in nodes"
        :key="node.url"
        :label="node.label"
        :node="node"
        @show-http-info="showHttpInfo = true"
      />
    </tbody>
  </SettingsDataTable>

  <HttpProtocolInfoDialog v-model="showHttpInfo" />
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import SettingsDataTable from '@/components/common/SettingsDataTable.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import HttpProtocolInfoDialog from '@/components/nodes/components/HttpProtocolInfoDialog.vue'
import ServiceNodesTableItem from './ServiceNodesTableItem.vue'
import { type NodeStatusResult } from '@/lib/nodes/abstract.node'
import { sortCoinNodesFn } from '@/components/nodes/utils/sortNodesFn'

export default defineComponent({
  components: {
    SettingsDataTable,
    NodesTableHead,
    HttpProtocolInfoDialog,
    ServiceNodesTableItem
  },
  setup() {
    const { t } = useI18n()
    const store = useStore()
    const showHttpInfo = ref(false)

    const nodes = computed<NodeStatusResult[]>(() => {
      const arr = store.getters['services/services']

      return [...arr].sort(sortCoinNodesFn)
    })

    const isAllNodesChecked = computed({
      get() {
        return nodes.value.every((node) => node.active)
      },
      set(value) {
        store.dispatch('services/toggleAll', { active: value })
      }
    })

    const isPartiallyChecked = computed(() => {
      return nodes.value.some((node) => node.active) && nodes.value.some((node) => !node.active)
    })

    return {
      t,
      nodes,
      isAllNodesChecked,
      isPartiallyChecked,
      showHttpInfo
    }
  }
})
</script>

<style lang="scss" scoped></style>
