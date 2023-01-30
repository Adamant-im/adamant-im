<template>
  <thead :class="classes.root">
    <tr>
      <th :class="classes.checkbox"></th>
      <th class="pl-0 pr-2">
        {{ t('nodes.host') }}
      </th>
      <th class="pl-0 pr-2">
        {{ t('nodes.ping') }}
      </th>
      <th class="pl-0 pr-2">
        {{ t('nodes.socket') }}
      </th>
    </tr>
  </thead>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  setup () {
    const { t } = useI18n()

    const className = 'nodes-table-head'
    const classes = {
      root: className,
      checkbox: `${className}__checkbox`
    }

    return {
      classes,
      t
    }
  }
}
</script>

<style lang="scss">
@import '~vuetify/settings';

.nodes-table-head {
  &__checkbox {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
}
</style>
