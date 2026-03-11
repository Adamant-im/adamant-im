<template>
  <div :class="classes.root">
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
        :size="NODE_STATUS_SPINNER_SIZE"
        :width="NODE_STATUS_SPINNER_WIDTH"
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
      <span v-if="nodeStatusDetail.icon" :class="classes.statusTextValueNoWrap">
        <v-icon :icon="nodeStatusDetail.icon" :size="NODE_STATUS_DETAIL_ICON_SIZE" />
        <span>&nbsp;{{ nodeStatusDetail.text }}</span>
      </span>
      <span v-else-if="!node.hasSupportedProtocol" :class="classes.statusTextValueNoWrap">
        {{ nodeStatusDetail.text }}
        <v-icon
          :icon="mdiHelpCircleOutline"
          size="small"
          :class="classes.detailHelpIcon"
          @click="$emit('showHttpInfo')"
        />
      </span>
      <template v-else>
        {{ nodeStatusDetail.text }}
      </template>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { useNodeStatus } from '@/components/nodes/hooks'
import { mdiCheckboxBlankCircle, mdiHelpCircleOutline } from '@mdi/js'
import {
  NODE_STATUS_DETAIL_ICON_SIZE,
  NODE_STATUS_SPINNER_SIZE,
  NODE_STATUS_SPINNER_WIDTH
} from '@/components/nodes/helpers/uiMetrics'

const className = 'node-status'
const classes = {
  root: className,
  textMs: `${className}__text-ms`,
  statusTitle: `${className}__status-title`,
  statusTitleText: `${className}__status-title-text`,
  statusTitleTextMuted: `${className}__status-title-text--muted`,
  statusText: `${className}__status-text`,
  statusTextValueNoWrap: `${className}__status-text-value--nowrap`,
  detailHelpIcon: `${className}__detail-help-icon`,
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
      mdiHelpCircleOutline,
      NODE_STATUS_DETAIL_ICON_SIZE,
      NODE_STATUS_SPINNER_SIZE,
      NODE_STATUS_SPINNER_WIDTH
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.node-status {
  --a-node-status-detail-font-size: var(--a-font-size-xs);
  --a-node-status-detail-font-weight: var(--a-font-weight-light);
  --a-node-status-indicator-offset-inline-start: var(--a-space-1);
  --a-node-status-text-color-dark: var(--a-color-text-muted-dark);

  &__status-title {
    width: var(--a-node-status-width);
    max-width: var(--a-node-status-max-width);
    display: flex;
    align-items: center;
  }

  &__status-title-text {
    line-height: 1;
  }

  &__status-text {
    display: block;
    margin-top: var(--a-node-status-detail-offset-block-start);
    font-size: var(--a-node-status-detail-font-size);
    font-weight: var(--a-node-status-detail-font-weight);
  }
  &__status-text-value--nowrap {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
  }

  &__icon {
    margin-inline-start: var(--a-node-status-indicator-offset-inline-start);
  }
  &__spinner {
    margin-inline-start: var(--a-node-status-indicator-offset-inline-start);

    :deep(svg) {
      animation-duration: 2.2s !important;
    }

    :deep(.v-progress-circular__overlay) {
      animation-duration: 2.2s !important;
    }
  }
  &__detail-help-icon {
    margin-inline-start: var(--a-space-1);
    margin-bottom: 0;
    cursor: pointer;
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
      color: var(--a-node-status-text-color-dark);
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
