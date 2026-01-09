<template>
  <div :class="classes.statusTitle">
    <span>
      {{ nodeStatusTitle
      }}<span v-if="node.status === 'online'" :class="classes.textMs">{{
        t('nodes.ms')
      }}</span></span
    >

    <v-icon
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

  <span v-if="nodeStatusDetail && node.status !== 'sync'" :class="classes.statusText">
    <v-icon v-if="nodeStatusDetail.icon" :icon="nodeStatusDetail.icon" :size="12" />
    {{ nodeStatusDetail.text }}

    <template v-if="!node.hasSupportedProtocol">
      <v-icon
        :icon="mdiHelpCircleOutline"
        size="small"
        class="ml-1 cursor-pointer"
        @click="showHttpInfo = true"
      />
    </template>
  </span>
  <v-dialog v-model="showHttpInfo" max-width="500px">
    <v-card>
      <v-card-title class="text-h6">
        {{ t('nodes.popup.http_restriction_title') }}
      </v-card-title>

      <v-card-text class="text-body-2">
        <p class="mb-4">
          {{ t('nodes.popup.http_restriction_intro') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.http_vs_https_title') }}
        </h3>
        <p class="mb-4">
          {{ t('nodes.popup.http_vs_https_http') }}<br />
          {{ t('nodes.popup.http_vs_https_https') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.adamant_encryption_title') }}
        </h3>
        <p class="mb-4">
          {{ t('nodes.popup.adamant_encryption_text') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.how_to_allow_title') }}
        </h3>
        <ul class="ml-4">
          <li>{{ t('nodes.popup.how_to_allow_browser') }}</li>
          <li>{{ t('nodes.popup.how_to_allow_http_app') }}</li>
        </ul>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="showHttpInfo = false">
          {{ t('nodes.popup.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { useNodeStatus } from '@/components/nodes/hooks'
import { mdiCheckboxBlankCircle, mdiHelpCircleOutline } from '@mdi/js'

const showHttpInfo = ref(false)

const className = 'node-status'
const classes = {
  textMs: `${className}__text-ms`,
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
    const { t } = useI18n()
    const { node } = toRefs(props)

    const { nodeStatusTitle, nodeStatusDetail, nodeStatusColor } = useNodeStatus(node)

    return {
      t,
      nodeStatusTitle,
      nodeStatusDetail,
      nodeStatusColor,
      showHttpInfo,
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
  }

  &__status-text {
    font-size: 12px;
    font-weight: 300;
  }

  &__icon {
    margin-inline-start: 4px;
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
