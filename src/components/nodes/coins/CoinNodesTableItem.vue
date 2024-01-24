<template>
  <tr :class="classes.root">
    <NodeColumn checkbox>
      <NodeStatusCheckbox :value="active" @change="toggleActiveStatus" />
    </NodeColumn>

    <NodeColumn align="left">
      <NodeLabel :label="label" />
    </NodeColumn>

    <NodeColumn>
      <span class="protocol">{{ getProtocol }}</span>
      <span class="nodeName">{{ getNodeName }}</span>
      <span class="domain">{{ getDomain }}</span>
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
import type { TNodeLabel } from '@/lib/nodes/constants'
import NodeColumn from '@/components/nodes/components/NodeColumn.vue'
import NodeLabel from '@/components/nodes/components/NodeLabel.vue'
import NodeStatus from '@/components/nodes/components/NodeStatus.vue'
import NodeVersion from '@/components/nodes/components/NodeVersion.vue'
import NodeStatusCheckbox from '@/components/nodes/components/NodeStatusCheckbox.vue'

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
    NodeLabel,
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
    const type = computed(() => props.node.type)

    const toggleActiveStatus = () => {
      store.dispatch('nodes/toggle', {
        type: type.value,
        url: url.value,
        active: !active.value
      })
      store.dispatch('nodes/updateStatus')
    }

    const getProtocol = computed(() => {
      const protocol = url.value.match(/^https:\/\//)
      return protocol ? protocol[0] : ''
    })

    const getNodeName = computed(() => {
      const nodeName = url.value.replace(/^https:\/\/|\.adamant\.im$/g, '')
      return nodeName
    })
    const getDomain = computed(() => {
      const domain = url.value.match(/\.adamant\.im/)
      return domain ? domain[0] : ''
    })

    return {
      classes,
      url,
      active,
      isUnsupported,
      toggleActiveStatus,
      getProtocol,
      getNodeName,
      getDomain
    }
  }
}
</script>

<style lang="scss">
@import '@/assets/styles/settings/_colors.scss';
.nodes-table-item {
}

.protocol,
.domain {
  color: map-get($adm-colors, 'grey-transparent');
  font-size: 12px;
}
.nodeName {
}
</style>
