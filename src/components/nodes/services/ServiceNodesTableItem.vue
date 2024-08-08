<template>
  <tr :class="classes.root">
    <NodeColumn checkbox>
      <NodeStatusCheckbox :value="active" @change="toggleActiveStatus" />
    </NodeColumn>

    <NodeColumn align="left">
      <NodeLabel :label="label" />
    </NodeColumn>

    <NodeColumn>
      <NodeUrl :node="node" />
      <NodeVersion v-if="node.version && active" :node="node" />
    </NodeColumn>

    <NodeColumn ping :colspan="isUnsupported ? 2 : 1">
      <NodeStatus :node="node" />
    </NodeColumn>
  </tr>
</template>

<script lang="ts">
import { computed, PropType } from 'vue'
import { useStore } from 'vuex'
import type { NodeStatusResult } from '@/lib/nodes/abstract.node'
import type { TNodeLabel } from '@/lib/nodes/constants'
import NodeUrl from '@/components/nodes/components/NodeUrl.vue'
import NodeColumn from '@/components/nodes/components/NodeColumn.vue'
import NodeLabel from '@/components/nodes/components/NodeLabel.vue'
import NodeStatus from '@/components/nodes/components/NodeStatus.vue'
import NodeStatusCheckbox from '@/components/nodes/components/NodeStatusCheckbox.vue'
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
    NodeVersion,
    NodeColumn,
    NodeStatus,
    NodeLabel,
    NodeUrl,
    NodeStatusCheckbox
  },
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    },
    label: {
      type: String as PropType<TNodeLabel>,
      required: true
    }
  },
  setup(props) {
    const store = useStore()

    const url = computed(() => props.node.url)
    const active = computed(() => props.node.active)
    const isUnsupported = computed(() => props.node.status === 'unsupported_version')
    const type = computed(() => props.node.label)

    const toggleActiveStatus = () => {
      store.dispatch('services/toggle', {
        type: type.value,
        url: url.value,
        active: !active.value
      })
      store.dispatch('services/updateStatus')
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

.nodeName {
}
</style>
