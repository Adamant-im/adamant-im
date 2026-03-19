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
        <button type="button" :class="classes.detailHelpButton" @click="$emit('showHttpInfo')">
          <v-icon :icon="mdiHelpCircleOutline" size="small" :class="classes.detailHelpIcon" />
        </button>
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
  detailHelpButton: `${className}__detail-help-button`,
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
@use '@/assets/styles/components/_color-roles.scss' as colorRoles;
@use '@/assets/styles/components/_layout-primitives.scss' as layoutPrimitives;
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.node-status {
  --a-node-status-detail-font-size: var(--a-font-size-xs);
  --a-node-status-detail-font-weight: var(--a-font-weight-light);
  --a-node-status-indicator-offset-inline-start: var(--a-space-1);
  @include colorRoles.a-color-role-supporting-var('--a-node-status-text-color');
  @include colorRoles.a-color-role-subtle-var('--a-node-status-meta-color');

  &__status-title {
    width: var(--a-node-status-width);
    max-width: var(--a-node-status-max-width);
    @include layoutPrimitives.a-flex-align-center();
  }

  &__status-title-text {
    line-height: var(--a-node-status-title-line-height);
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
      animation-duration: var(--a-node-status-spinner-animation-duration);
    }

    :deep(.v-progress-circular__overlay) {
      animation-duration: var(--a-node-status-spinner-animation-duration);
    }
  }
  &__detail-help-button {
    margin-inline-start: var(--a-space-1);
    padding: 0;
    border: 0;
    background: transparent;
    line-height: 0;
  }
  &__detail-help-icon {
    margin-bottom: 0;
  }

  &__text-ms {
    @include mixins.a-text-explanation-small();
  }
}

.v-theme--light {
  .node-status {
    &__status-text {
      color: var(--a-node-status-text-color);
    }
    &__text-ms {
      color: var(--a-node-status-meta-color);
    }
    &__status-title-text--muted {
      color: var(--a-node-status-meta-color);
    }
    &__spinner {
      color: var(--a-node-status-meta-color);
    }

    &__icon {
      &--green {
        color: map.get(colors.$adm-colors, 'good');
      }
      &--red {
        color: map.get(colors.$adm-colors, 'danger');
      }
      &--grey {
        color: map.get(colors.$adm-colors, 'grey');
      }
      &--orange {
        color: map.get(colors.$adm-colors, 'attention');
      }
    }
  }
}

.v-theme--dark {
  .node-status {
    &__status-text {
      color: var(--a-node-status-text-color);
    }
    &__text-ms {
      color: var(--a-node-status-meta-color);
    }
    &__status-title-text--muted {
      color: var(--a-node-status-meta-color);
    }
    &__spinner {
      color: var(--a-node-status-meta-color);
    }
    &__icon {
      &--green {
        color: map.get(colors.$adm-colors, 'good');
      }
      &--red {
        color: map.get(colors.$adm-colors, 'danger');
      }
      &--grey {
        color: map.get(colors.$adm-colors, 'grey');
      }
      &--orange {
        color: map.get(colors.$adm-colors, 'attention');
      }
    }
  }
}
</style>
