<template>
  <div :class="classes.statusTitle">
    {{ nodeStatusTitle }}

    <v-icon
      :class="{
        [classes.icon]: true,
        [classes.iconGreen]: nodeStatusColor === 'green',
        [classes.iconRed]: nodeStatusColor === 'red',
        [classes.iconOrange]: nodeStatusColor === 'orange',
        [classes.iconGrey]: nodeStatusColor === 'grey'
      }"
      :color="nodeStatusColor"
      icon="mdi-checkbox-blank-circle"
      size="small"
    />
  </div>

  <span v-if="nodeStatusText" :class="classes.statusText">{{ nodeStatusText }}</span>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { useNodeStatus } from '@/components/nodes/hooks'

const className = 'node-status'
const classes = {
  statusTitle: `${className}__status-title`,
  statusText: `${className}__status-text`,
  icon: `${className}__icon`,
  iconGreen: `${className}__icon--green`,
  iconRed: `${className}__icon--red`,
  iconOrange: `${className}__icon--orange`,
  iconGrey: `${className}__icon--grey`
}

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    }
  },
  setup(props) {
    const { node } = toRefs(props)

    const { nodeStatusTitle, nodeStatusText, nodeStatusColor } = useNodeStatus(node)

    return {
      nodeStatusTitle,
      nodeStatusText,
      nodeStatusColor,
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
@import '../../../assets/styles/settings/_colors.scss';

.node-status {
  &__status-title {
    line-height: 17px;
    display: flex;
  }

  &__status-text {
    font-size: 12px;
    font-weight: 300;
  }

  &__icon {
    margin-inline-start: 4px;
  }
}

.v-theme--light {
  .node-status {
    &__status-text {
      color: map-get($adm-colors, 'regular');
    }

    &__icon {
      &--green {
        color: map-get($adm-colors, 'good') !important;
      }
      &--red {
        color: map-get($adm-colors, 'danger') !important;
      }
      &--grey {
        color: map-get($adm-colors, 'grey') !important;
      }
      &--orange {
        color: map-get($adm-colors, 'attention') !important;
      }
    }
  }
}

.v-theme--dark {
  .node-status {
    &__status-text {
      color: map-get($shades, 'white');
      opacity: 0.7;
    }
    &__icon {
      &--green {
        color: map-get($adm-colors, 'good') !important;
      }
      &--red {
        color: map-get($adm-colors, 'danger') !important;
      }
      &--grey {
        color: map-get($adm-colors, 'grey') !important;
      }
      &--orange {
        color: map-get($adm-colors, 'attention') !important;
      }
    }
  }
}
</style>
