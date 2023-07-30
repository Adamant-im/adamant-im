<template>
  <tr :class="classes.root">
    <td
      :class="{
        [classes.td]: true,
        [classes.tdCheckbox]: true
      }"
      class="pl-0 pr-0"
    >
      <v-checkbox-btn
        :model-value="active"
        :class="[classes.checkbox, classes.statusIconGrey]"
        @input="toggleActiveStatus"
      />
    </td>

    <td :class="classes.td" class="pl-0 pr-2">
      {{ url }}
      <div v-if="version" :class="classes.version">
        {{ 'v' + version }}
      </div>
    </td>

    <td :class="classes.td" class="pl-0 pr-2">
      <span>
        {{ nodeStatus }}
      </span>
      <v-icon
        :class="{
          [classes.statusIcon]: true,
          [classes.statusIconGreen]: nodeStatusColor === 'green',
          [classes.statusIconRed]: nodeStatusColor === 'red',
          [classes.statusIconOrange]: nodeStatusColor === 'orange',
          [classes.statusIconGrey]: nodeStatusColor === 'grey'
        }"
        :color="nodeStatusColor"
        icon="mdi-checkbox-blank-circle"
        size="small"
      />
    </td>

    <td :class="classes.td" class="pl-0 pr-2">
      <v-icon
        :icon="socketSupport ? 'mdi-check' : 'mdi-close'"
        :class="socketSupport ? classes.statusIconGreen : classes.statusIconRed"
      />
    </td>
  </tr>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

function getNodeStatus(node, t) {
  if (!node.hasMinApiVersion || !node.hasSupportedProtocol) {
    return t('nodes.unsupported')
  } else if (!node.active) {
    return t('nodes.inactive')
  } else if (!node.online) {
    return t('nodes.offline')
  } else if (node.outOfSync) {
    return t('nodes.sync')
  }

  return node.ping + ' ' + t('nodes.ms')
}

function getNodeStatusColor(node) {
  let color = 'green'

  if (!node.hasMinApiVersion || !node.hasSupportedProtocol) {
    color = 'red'
  } else if (!node.active) {
    color = 'grey'
  } else if (!node.online) {
    color = 'red'
  } else if (node.outOfSync) {
    color = 'orange'
  }

  return color
}

export default {
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const { t } = useI18n()
    const store = useStore()

    const className = 'nodes-table-item'
    const classes = {
      root: className,
      td: `${className}__td`,
      checkbox: `${className}__checkbox`,
      version: `${className}__version`,
      statusIcon: `${className}__status-icon`,
      statusIconGreen: `${className}__status-icon--green`,
      statusIconRed: `${className}__status-icon--red`,
      statusIconOrange: `${className}__status-icon--orange`,
      statusIconGrey: `${className}__status-icon--grey`,
      tdCheckbox: `${className}__td-checkbox`
    }

    const url = computed(() => props.node.url)
    const version = computed(() => props.node.version)
    const active = computed(() => props.node.active)
    const socketSupport = computed(() => props.node.socketSupport)

    const nodeStatus = computed(() => getNodeStatus(props.node, t))
    const nodeStatusColor = computed(() => getNodeStatusColor(props.node))

    const toggleActiveStatus = () => {
      store.dispatch('nodes/toggle', {
        url: url.value,
        active: !active.value
      })
      store.dispatch('nodes/updateStatus')
    }

    return {
      classes,
      url,
      version,
      active,
      socketSupport,
      nodeStatus,
      toggleActiveStatus,
      nodeStatusColor
    }
  }
}
</script>

<style lang="scss">
@import 'vuetify/settings';
@import '../../assets/styles/settings/_colors.scss';
@import '../../assets/styles/themes/adamant/_mixins.scss';

.nodes-table-item {
  &__td {
    font-size: 14px;
  }
  &__version {
    @include a-text-explanation-small();
  }
  &__status-icon {
    margin-inline-start: 4px;
  }
  &__td-checkbox {
    width: 64px;
    max-width: 64px;
  }
  &__checkbox {
    font-size: 16px;
    margin-left: 16px;
  }
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .nodes-table-item {
    &__td-checkbox {
      width: 56px;
      max-width: 56px;
    }
    &__checkbox {
      margin-left: 8px;
    }
  }
}

.v-theme--light {
  .nodes-table-item {
    &__version {
      color: map-get($adm-colors, 'regular');
    }
    &__td {
      color: map-get($adm-colors, 'regular');
    }
    &__status-icon {
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
  .nodes-table-item {
    &__version {
      opacity: 0.7;
    }
    &__status-icon {
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
