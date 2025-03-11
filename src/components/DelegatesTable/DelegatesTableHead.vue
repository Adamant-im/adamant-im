<template>
  <thead :class="classes.root">
    <tr>
      <th :class="classes.td" class="pl-4 pr-2">
        {{ t('votes.table_head_name') }}
      </th>
      <th :class="classes.td" class="pl-0 pr-2">
        {{ t('votes.table_head_rank') }}
      </th>
      <th :class="classes.td" class="pl-0 pr-2">
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
      td: `${className}__td`
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
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.delegates-table-head {
  &__td {
    font-weight: 300;
    font-size: 12px;
  }
}

.v-theme--light {
  .delegates-table-head {
    &__td {
      color: map.get(colors.$adm-colors, 'muted');
    }
  }
}

.v-theme--dark {
  .delegates-table-head {
    &__td {
      border-bottom: none !important;
    }
  }
}
</style>
