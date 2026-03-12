<template>
  <tr :class="[classes.item, classes.itemInteractive]" @click="handleClick">
    <td
      :class="{
        [classes.td]: true,
        [classes.tdUsername]: true
      }"
    >
      {{ username }}
    </td>

    <td :class="classes.td">
      {{ rank }}
    </td>

    <td :class="classes.td">
      <delegate-vote-checkbox :delegate="delegate" />
    </td>
  </tr>

  <!-- eslint-disable vue/no-multiple-template-root -->
  <tr v-if="detailsExpanded" :class="classes.details">
    <td colspan="3" :class="classes.detailsCell">
      <delegate-details-expander :delegate="delegate" />
    </td>
  </tr>
  <!-- eslint-enable vue/no-multiple-template-root -->
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

import DelegateVoteCheckbox from '@/components/DelegatesTable/DelegateVoteCheckbox.vue'
import DelegateDetailsExpander from '@/components/DelegatesTable/DelegateDetailsExpander.vue'

const emits = {
  updateDetailsExpanded: 'update:detailsExpanded'
}

export default {
  components: {
    DelegateDetailsExpander,
    DelegateVoteCheckbox
  },
  props: {
    delegate: {
      type: Object,
      required: true
    },
    detailsExpanded: {
      type: Boolean,
      required: false
    }
  },
  emits: Object.values(emits),
  setup(props, { emit }) {
    const { delegate } = props
    const detailsExpanded = computed(() => props.detailsExpanded)

    const store = useStore()

    const className = 'delegates-table-item'
    const classes = {
      item: className,
      itemInteractive: `${className}--interactive`,
      details: `${className}__details`,
      detailsCell: `${className}__details-cell`,
      td: `${className}__td`,
      tdUsername: `${className}__td-username`
    }

    const username = computed(() => delegate.username)
    const rank = computed(() => delegate.rank)

    const handleClick = () => {
      if (detailsExpanded.value) {
        return emit(emits.updateDetailsExpanded, false)
      } else {
        store.dispatch('delegates/getForgedByAccount', delegate)
        store.dispatch('delegates/getForgingTimeForDelegate', delegate)

        return emit(emits.updateDetailsExpanded, true)
      }
    }

    return {
      classes,
      username,
      rank,
      handleClick
    }
  }
}
</script>

<style lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';

.delegates-table-item {
  --a-delegates-table-item-font-size: var(--a-font-size-sm);
  --a-delegates-table-item-padding-inline-end: var(--a-space-2);
  --a-delegates-table-item-padding-inline-start-primary: var(--a-space-4);

  &--interactive {
    cursor: pointer;
  }

  td.delegates-table-item__td {
    font-size: var(--a-delegates-table-item-font-size);
    padding-left: 0;
    padding-right: var(--a-delegates-table-item-padding-inline-end);
  }

  td.delegates-table-item__td-username {
    padding-left: var(--a-delegates-table-item-padding-inline-start-primary);
  }

  td.delegates-table-item__details-cell {
    padding: 0;
  }
}

.v-theme--light {
  .delegates-table-item {
    &__td {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .delegates-table-item {
    &__td {
      border-bottom: none !important;
      border-top: thin solid map.get(colors.$adm-colors, 'regular');
    }
  }
}
</style>
