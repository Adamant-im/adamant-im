<template>
  <tr :class="classes.root">
    <NodeColumn checkbox>
      <NodeStatusCheckbox :value="active" @change="toggleActiveStatus" />
    </NodeColumn>

    <NodeColumn>
      <span class="protocol">{{ protocol }}//</span>
      <span v-if="result === false" class="nodeName">{{ nodeName }}</span>
      <span v-if="result === false" class="domain">.{{ domain }}</span>
      <span v-else-if="result" class="nodeName">{{ hostname }}</span>
      <span v-if="port" class="domain">:{{ port }}</span>
      <NodeVersion v-if="node.version" :node="node" />
    </NodeColumn>

    <NodeColumn :colspan="!showSocketColumn ? 2 : 1">
      <NodeStatus :node="node" />
    </NodeColumn>

    <NodeColumn v-if="showSocketColumn">
      <SocketSupport :node="node" />
    </NodeColumn>
  </tr>
</template>

<script lang="ts">
import { computed, PropType } from 'vue'
import { useStore } from 'vuex'
import type { NodeStatusResult } from '@/lib/nodes/abstract.node'
import NodeColumn from '@/components/nodes/components/NodeColumn.vue'
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
    SocketSupport
  },
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    }
  },
  setup(props) {
    const store = useStore()

    const url = computed(() => props.node.url)
    const active = computed(() => props.node.active)
    const socketSupport = computed(() => props.node.socketSupport)
    const isUnsupported = computed(() => props.node.status === 'unsupported_version')
    const type = computed(() => props.node.type)
    const showSocketColumn = computed(() => active.value && !isUnsupported.value)

    const toggleActiveStatus = () => {
      store.dispatch('nodes/toggle', {
        type: type.value,
        url: url.value,
        active: !active.value
      })
      store.dispatch('nodes/updateStatus')
    }

    const baseUrl = new URL(url.value)
    const protocol = baseUrl.protocol
    const hostname = baseUrl.hostname
    const port = baseUrl.port
    const result = /^[\d.]+$/.test(hostname)

    let nodeName: string | null = null
    let domain: string | null = null

    if (result === false) {
      const regex = /([^.]*)\.(.*)/
      const parts = hostname.match(regex)

      if (parts !== null) {
        nodeName = parts[1]
        domain = parts[2]
      }
    }

    return {
      classes,
      url,
      active,
      socketSupport,
      isUnsupported,
      showSocketColumn,
      toggleActiveStatus,
      protocol,
      hostname,
      nodeName,
      domain,
      result,
      port
    }
  }
}
</script>

<style lang="scss">
@import '@/assets/styles/settings/_colors.scss';
.amd-nodes-table-item {
  line-height: 14px;
}
.protocol,
.domain,
.port {
  color: map-get($adm-colors, 'grey-transparent');
  font-size: 12px;
  display: inline-block;
}
</style>
