<template>
  <tr :class="classes.root">
    <NodeColumn checkbox>
      <NodeLabel :label="blockchain" />
    </NodeColumn>

    <NodeColumn>
      {{ url }}
      <NodeVersion v-if="node.version" :node="node" />
    </NodeColumn>

    <NodeColumn :colspan="isUnsupported ? 2 : 1">
      <NodeStatus :node="node" />
    </NodeColumn>
  </tr>
</template>

<script lang="ts">
import { computed, PropType } from 'vue'
import { useStore } from 'vuex'
import type { NodeStatusResult } from '@/lib/nodes/abstract.node'
import type { NodeType } from '@/lib/nodes/types'
import NodeColumn from '@/components/nodes/components/NodeColumn.vue'
import NodeLabel from '@/components/nodes/components/NodeLabel.vue'
import NodeStatus from '@/components/nodes/components/NodeStatus.vue'
import NodeVersion from '@/components/nodes/components/NodeVersion.vue'

const className = 'nodes-table-item'
const classes = {
  root: className,
  column: `${className}__column`,
  columnCheckbox: `${className}__column--checkbox`,
  checkbox: `${className}__checkbox`
}

export default {
  components: {
    NodeColumn,
    NodeStatus,
    NodeVersion,
    NodeLabel
  },
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    },
    blockchain: {
      type: String as PropType<NodeType>,
      required: true
    }
  },
  setup(props) {
    const store = useStore()

    const url = computed(() => props.node.url)
    const active = computed(() => props.node.active)
    const isUnsupported = computed(() => props.node.status === 'unsupported_version')

    const toggleActiveStatus = () => {
      store.dispatch('nodes/toggle', {
        url: url.value,
        active: !active.value
      })
      store.dispatch('nodes/updateStatus')
    }

    return {
      classes,
      url,
      active,
      isUnsupported,
      toggleActiveStatus
    }
  }
}
</script>

<style lang="scss">
.nodes-table-item {
}
</style>
