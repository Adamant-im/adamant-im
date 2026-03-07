<template>
  <thead :class="classes.root">
    <tr>
      <th :class="[classes.td, classes.tdPrimary]">
        {{ t('votes.table_head_name') }}
      </th>
      <th :class="classes.td">
        {{ t('votes.table_head_rank') }}
      </th>
      <th :class="classes.td">
        {{ t('votes.table_head_vote') }}
      </th>
    </tr>
  </thead>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  setup() {
    const { t } = useI18n()

    const className = 'delegates-table-head'
    const classes = {
      root: className,
      td: `${className}__td`,
      tdPrimary: `${className}__td--primary`
    }

    return {
      classes,
      t
    }
  }
}
</script>

<style lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';

.delegates-table-head {
  --a-delegates-table-head-font-size: var(--a-font-size-xs);
  --a-delegates-table-head-padding-inline-end: var(--a-space-2);
  --a-delegates-table-head-padding-inline-start-primary: var(--a-space-4);

  &__td {
    font-size: var(--a-delegates-table-head-font-size);
    padding-left: 0 !important;
    padding-right: var(--a-delegates-table-head-padding-inline-end) !important;
  }

  &__td--primary {
    padding-left: var(--a-delegates-table-head-padding-inline-start-primary) !important;
  }
}

.v-theme--light {
  .delegates-table-head {
    &__td {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .delegates-table-head {
    &__td {
      color: map.get(colors.$adm-colors, 'grey-transparent');
      border-bottom: none !important;
    }
  }
}
</style>
