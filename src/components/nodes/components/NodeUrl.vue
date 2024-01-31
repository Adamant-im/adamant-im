<template>
  <span :class="classes.protocol">{{ computedResult.protocol }}//</span>
  <span v-if="computedResult.result === false" :class="classes.nodeName">{{
    computedResult.nodeName
  }}</span>
  <span v-if="computedResult.result === false" :class="classes.domain"
    >.{{ computedResult.domain }}</span
  >
  <span v-else-if="computedResult.result" :class="classes.nodeName">{{
    computedResult.hostname
  }}</span>
  <span v-if="computedResult.port" :class="classes.port">:{{ computedResult.port }}</span>
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
    const url = computed(() => props.node.url)

    const computedResult = computed(() => {
      const baseUrl = new URL(url.value)
      const protocol = baseUrl.protocol
      const hostname = baseUrl.hostname
      const port = baseUrl.port
      const result = /^[\d.]+$/.test(hostname)

      let nodeName = null
      let domain = null

      if (result === false) {
        const regex = /([^.]*)\.(.*)/
        const parts = hostname.match(regex)
        if (parts !== null) {
          nodeName = parts[1]
          domain = parts[2]
        }
      }

      return {
        protocol,
        hostname,
        nodeName,
        domain,
        result,
        port
      }
    })

    return {
      classes,
      url,
      computedResult
    }
  }
}
</script>
<style lang="scss">
@import '@/assets/styles/settings/_colors.scss';
@import 'vuetify/settings';

.node-url {
  &__domain,
  &__protocol,
  &__port {
    font-size: 12px;
    display: inline-block;
  }
}

.v-theme--light {
  .node-url {
    &__domain,
    &__protocol,
    &__port {
      color: map-get($adm-colors, 'muted');
    }
  }
}

.v-theme--dark {
  .node-url {
    &__domain,
    &__protocol,
    &__port {
      color: map-get($adm-colors, 'grey-transparent');
    }
  }
}
</style>
