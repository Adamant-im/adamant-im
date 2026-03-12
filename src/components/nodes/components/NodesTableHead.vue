<template>
  <thead :class="classes.root">
    <tr>
      <th :class="classes.checkbox" v-if="!hideCheckbox">
        <NodeStatusCheckbox v-model="isAllEnabled" :indeterminate="indeterminate" />
      </th>
      <th :class="classes.label" v-if="label">
        {{ label }}
      </th>
      <th :class="classes.th" v-if="!hideHost">
        {{ t('nodes.host') }}
      </th>
      <th :class="classes.th" v-if="!hidePing">
        {{ t('nodes.ping') }}
      </th>
      <th :class="classes.th" v-if="!hideSocket">
        {{ t('nodes.socket') }}
      </th>
    </tr>
  </thead>
</template>

<script>
import { computed } from 'vue'
import NodeStatusCheckbox from './NodeStatusCheckbox.vue'
import { useI18n } from 'vue-i18n'

const className = 'nodes-table-head'
const classes = {
  root: className,
  th: `${className}__th`,
  checkbox: `${className}__checkbox`,
  label: `${className}__label`
}

export default {
  components: {
    NodeStatusCheckbox
  },
  props: {
    modelValue: {
      type: Boolean
    },
    hideCheckbox: {
      type: Boolean
    },
    hideHost: {
      type: Boolean
    },
    hidePing: {
      type: Boolean
    },
    hideSocket: {
      type: Boolean
    },
    label: {
      type: String
    },
    indeterminate: {
      type: Boolean
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const isAllEnabled = computed({
      get() {
        return props.modelValue
      },
      set(value) {
        emit('update:modelValue', value)
      }
    })

    return {
      classes,
      t,
      isAllEnabled
    }
  }
}
</script>

<style lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';

.nodes-table-head {
  --a-nodes-table-head-font-size: var(--a-font-size-xs);
  --a-nodes-table-head-padding-inline-end: var(--a-space-2);

  &__th {
    font-size: var(--a-nodes-table-head-font-size);
    padding-left: 0 !important;
    padding-right: var(--a-nodes-table-head-padding-inline-end) !important;
  }

  &__checkbox {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  &__label {
    font-size: var(--a-nodes-table-head-font-size);
    width: var(--a-nodes-table-head-label-width);
    padding-left: 0 !important;
    padding-right: var(--a-nodes-table-head-padding-inline-end) !important;
  }
}

/** Themes **/
.v-theme--light {
  .nodes-table-head {
    &__th,
    &__label {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
.v-theme--dark {
  .nodes-table-head {
    &__th,
    &__label {
      color: map.get(colors.$adm-colors, 'white');
    }
  }
}
</style>
