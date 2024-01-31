<template>
  <tr :class="classes.root">
    <NodeColumn checkbox>
      <NodeStatusCheckbox :value="active" @change="toggleActiveStatus" />
    </NodeColumn>

    <NodeColumn align="left">
      <NodeLabel :label="label" />
    </NodeColumn>

    <NodeColumn>
      <span class="protocol">{{ getCoinLink.protocol }}</span>
      <span class="nodeName">{{ getCoinLink.nodeName }}</span>
      <span class="domain">{{ getCoinLink.domain }}</span>
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

    const getCoinLink = computed(() => {
      const regex = url.value.match(/^(https:\/\/)?(.*?)\.adamant\.im$/)
      if (regex) {
        const protocol = regex[1] || ''
        const nodeName = regex[2] || ''
        const domain = '.adamant.im'
        return { protocol, nodeName, domain }
      } else {
        return { protocol: '', nodeName: '', domain: '' }
      }
    })

    return {
      classes,
      url,
      active,
      isUnsupported,
      toggleActiveStatus,
      getCoinLink
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
  display: inline-block;
}
.nodeName {
}
</style>
