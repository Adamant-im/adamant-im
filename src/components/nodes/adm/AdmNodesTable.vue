<template>
  <NodesTableContainer>
    <NodesTableHead v-model="isAllChecked" />

    <tbody>
      <AdmNodesTableItem v-for="node in admNodes" :key="node.url" blockchain="adm" :node="node" />
    </tbody>
  </NodesTableContainer>
</template>

<script lang="ts">
import { ref, computed, watch, defineComponent } from 'vue'
import { useStore } from 'vuex'
import NodesTableContainer from '@/components/nodes/components/NodesTableContainer.vue'
import NodesTableHead from '@/components/nodes/components/NodesTableHead.vue'
import AdmNodesTableItem from './AdmNodesTableItem.vue'
import { sortNodesFn } from '@/components/nodes/utils/sortNodesFn'

const className = 'adm-nodes-table'
const classes = {
  root: className
}

export default defineComponent({
  components: {
    NodesTableContainer,
    NodesTableHead,
    AdmNodesTableItem
  },
  setup() {
    const store = useStore()

    const admNodes = computed(() => {
      const arr = store.getters['nodes/adm']

      return [...arr].sort(sortNodesFn)
    })

    const isAllChecked = ref(false)

    const isAllNodesEnabled = !admNodes.value.some(node => node.active === false)
    if (isAllNodesEnabled) isAllChecked.value = true

    watch(isAllChecked, (value) => {
      admNodes.value.forEach((admNode) => {
        if (admNode && admNode.active !== value) {
          store.dispatch('nodes/toggle', {...admNode, active: value})
        }
      })
    })

    return {
      admNodes,
      classes,
      isAllChecked
    }
  }
})
</script>

<style lang="scss"></style>
