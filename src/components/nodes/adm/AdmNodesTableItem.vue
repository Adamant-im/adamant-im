<template>
  <tr :class="classes.root">
    <NodeColumn checkbox>
      <NodeStatusCheckbox :value="active" @change="toggleActiveStatus" />
    </NodeColumn>

    <NodeColumn>
      {{ url }}
      <NodeLabel v-if="blockchain !== 'adm'" :label="blockchain" />
      <NodeVersion v-if="node.version" :node="node" />
    </NodeColumn>

    <NodeColumn :colspan="isUnsupported ? 2 : 1">
      <NodeStatus :node="node" />
    </NodeColumn>

    <NodeColumn v-if="!isUnsupported">
      <SocketSupport :node="node" />
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
import SocketSupport from '@/components/nodes/components/SocketSupport.vue'
import NodeStatusCheckbox from '@/components/nodes/components/NodeStatusCheckbox.vue'

const className = 'amd-nodes-table-item'
const classes = {
  root: className,
  column: `${className}__column`,
  columnCheckbox: `${className}__column--checkbox`,
  checkbox: `${className}__checkbox`
}

export default {
  components: {
    NodeStatusCheckbox,
    NodeColumn,
    NodeStatus,
    NodeVersion,
    SocketSupport,
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
    const socketSupport = computed(() => props.node.socketSupport)
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
      socketSupport,
      isUnsupported,
      toggleActiveStatus
    }
  }
}
</script>

<style lang="scss">
.amd-nodes-table-item {
}
</style>
