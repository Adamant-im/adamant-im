<template>
  <span :class="classes.root">
    <span :class="classes.protocol">{{ protocol }}//</span>

    <span v-if="isIP" :class="classes.nodeName">{{ hostname }}</span>

    <template v-else>
      <span :class="classes.nodeName">{{ nodeHost.name }}</span>
      <span v-if="nodeHost.domain" :class="classes.domain">.{{ nodeHost.domain }}</span>
    </template>

    <span v-if="port" :class="classes.port">:{{ port }}</span>
  </span>
</template>
<script lang="ts">
import { computed, PropType } from 'vue'
import type { NodeStatusResult } from '@/lib/nodes/abstract.node'

const className = 'node-url'
const classes = {
  root: className,
  nodeName: `${className}__node-name`,
  domain: `${className}__domain`,
  protocol: `${className}__protocol`,
  port: `${className}__port`
}

export default {
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    }
  },
  setup(props) {
    const url = computed(() => new URL(props.node.url))
    const protocol = computed(() => url.value.protocol)
    const hostname = computed(() => url.value.hostname)
    const port = computed(() => url.value.port)

    const isIP = computed(() => /^[\d.]+$/.test(hostname.value))

    const nodeHost = computed(() => {
      let name = null
      let domain = null

      if (!isIP.value) {
        const regex = /([^.]*)\.?(.*)/
        const parts = hostname.value.match(regex)
        if (parts !== null) {
          name = parts[1]
          domain = parts[2]
        }
      }

      return {
        name,
        domain
      }
    })

    return {
      classes,
      protocol,
      hostname,
      port,
      isIP,
      nodeHost
    }
  }
}
</script>
<style lang="scss">
@use '@/assets/styles/components/_color-roles.scss' as colorRoles;

.node-url {
  --a-node-url-meta-font-size: var(--a-font-size-xs);
  @include colorRoles.a-color-role-subtle-var('--a-node-url-meta-color');

  &__domain,
  &__protocol,
  &__port {
    font-size: var(--a-node-url-meta-font-size);
    display: inline-block;
    color: var(--a-node-url-meta-color);
  }
}
</style>
