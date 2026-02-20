<template>
  <div :class="classes.statusTitle">
    <span
      :class="{
        [classes.statusTitleText]: true,
        [classes.statusTitleTextMuted]: nodeStatusUpdating
      }"
    >
      {{ nodeStatusTitle
      }}<span v-if="node.status === 'online' && !nodeStatusUpdating" :class="classes.textMs">{{
        t('nodes.ms')
      }}</span></span
    >

    <v-progress-circular
      v-if="nodeStatusUpdating"
      :class="classes.spinner"
      indeterminate
      size="12"
      width="2"
    />

    <v-icon
      v-else
      :class="{
        [classes.icon]: true,
        [classes.iconGreen]: nodeStatusColor === 'green',
        [classes.iconRed]: nodeStatusColor === 'red',
        [classes.iconOrange]: nodeStatusColor === 'orange',
        [classes.iconGrey]: nodeStatusColor === 'grey'
      }"
      :color="nodeStatusColor"
      :icon="mdiCheckboxBlankCircle"
      size="small"
    />
  </div>

  <span
    v-if="nodeStatusDetail && node.status !== 'sync' && !nodeStatusUpdating"
    :class="classes.statusText"
  >
    <v-icon v-if="nodeStatusDetail.icon" :icon="nodeStatusDetail.icon" :size="12" />
    {{ nodeStatusDetail.text }}

    <template v-if="!node.hasSupportedProtocol">
      <v-icon
        :icon="mdiHelpCircleOutline"
        size="small"
        class="ml-0 cursor-pointer mb-1"
        @click="$emit('showHttpInfo')"
      />
    </template>
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { useNodeStatus } from '@/components/nodes/hooks'
import { mdiCheckboxBlankCircle, mdiHelpCircleOutline } from '@mdi/js'

const className = 'node-status'
const classes = {
  textMs: `${className}__text-ms`,
  statusTitle: `${className}__status-title`,
  statusTitleText: `${className}__status-title-text`,
  statusTitleTextMuted: `${className}__status-title-text--muted`,
  statusText: `${className}__status-text`,
  spinner: `${className}__spinner`,
  icon: `${className}__icon`,
  iconGreen: `${className}__icon--green`,
  iconRed: `${className}__icon--red`,
  iconOrange: `${className}__icon--orange`,
  iconGrey: `${className}__icon--grey`
}

export default defineComponent({
  emits: ['showHttpInfo'],
  props: {
    node: {
      type: Object as PropType<NodeStatusResult>,
      required: true
    }
  },
  setup(props) {
    const { t } = useI18n()
    const { node } = toRefs(props)

    const { nodeStatusTitle, nodeStatusDetail, nodeStatusColor, nodeStatusUpdating } =
      useNodeStatus(node)

    return {
      t,
      nodeStatusTitle,
      nodeStatusDetail,
      nodeStatusColor,
      nodeStatusUpdating,
      classes,
      mdiCheckboxBlankCircle,
      mdiHelpCircleOutline
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.node-status {
  &__status-title {
    width: 76px;
    max-width: 80px;
    display: flex;
    align-items: center;
  }

  &__status-title-text {
    line-height: 1;
  }

  &__status-text {
    font-size: 12px;
    font-weight: 300;
  }

  &__icon {
    margin-inline-start: 4px;
  }
  &__spinner {
    margin-inline-start: 4px;

    :deep(svg) {
      animation-duration: 2.2s !important;
    }

    :deep(.v-progress-circular__overlay) {
      animation-duration: 2.2s !important;
    }
  }
  &__text-ms {
    @include mixins.a-text-explanation-small();
  }
}

.v-theme--light {
  .node-status {
    &__status-text {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__text-ms {
      color: map.get(colors.$adm-colors, 'muted');
    }
    &__status-title-text--muted {
      color: map.get(colors.$adm-colors, 'muted');
    }
    &__spinner {
      color: map.get(colors.$adm-colors, 'muted');
    }

    &__icon {
      &--green {
        color: map.get(colors.$adm-colors, 'good') !important;
      }
      &--red {
        color: map.get(colors.$adm-colors, 'danger') !important;
      }
      &--grey {
        color: map.get(colors.$adm-colors, 'grey') !important;
      }
      &--orange {
        color: map.get(colors.$adm-colors, 'attention') !important;
      }
    }
  }
}

.v-theme--dark {
  .node-status {
    &__status-text {
      color: map.get(settings.$shades, 'white');
      opacity: 0.7;
    }
    &__text-ms {
      color: map.get(colors.$adm-colors, 'grey-transparent');
    }
    &__status-title-text--muted {
      color: map.get(colors.$adm-colors, 'grey-transparent');
    }
    &__spinner {
      color: map.get(colors.$adm-colors, 'grey-transparent');
    }
    &__icon {
      &--green {
        color: map.get(colors.$adm-colors, 'good') !important;
      }
      &--red {
        color: map.get(colors.$adm-colors, 'danger') !important;
      }
      &--grey {
        color: map.get(colors.$adm-colors, 'grey') !important;
      }
      &--orange {
        color: map.get(colors.$adm-colors, 'attention') !important;
      }
    }
  }
}
</style>
