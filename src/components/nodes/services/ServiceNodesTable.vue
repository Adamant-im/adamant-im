<template>
  <NodesTableContainer>
    <NodesTableHead v-model="isAllChecked" hide-socket :label="t('nodes.service')" />

    <tbody>
      <ServiceNodesTableItem
        v-for="node in nodes"
        :key="node.url"
        :label="node.label"
        :node="node"
      />
    </tbody>
  </NodesTableContainer>
</template>

<script lang="ts">
import { ref, computed, watch, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import ServiceNodesTableItem from './ServiceNodesTableItem.vue'
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
    ServiceNodesTableItem
  },
  setup() {
    const { t } = useI18n()
    const store = useStore()

    const nodes = computed<NodeStatusResult[]>(() => {
      const arr = store.getters['services/services']

      return [...arr].sort(sortCoinNodesFn)
    })

    const isAllChecked = ref(false)

    const isAllNodesEnabled = !nodes.value.some(node => node.active === false)
    if (isAllNodesEnabled) isAllChecked.value = true

    watch(isAllChecked, (value) => {
      nodes.value.forEach((node) => {
        if (node && node.active !== value) {
          const { label, url } = node
          store.dispatch('services/toggle', {type: label, url, active: value})
        }
      })
    })      

    return {
      t,
      nodes,
      classes,
      isAllChecked
    }
  }
})
</script>

<style lang="scss" scoped></style>
