<template>
  <tr
    :class="classes.item"
    @click="handleClick"
  >
    <td
      :class="classes.td"
      class="pl-4 pr-2"
    >
      {{ username }}
    </td>

    <td
      :class="classes.td"
      class="pl-0 pr-2"
    >
      {{ rank }}
    </td>

    <td
      :class="classes.td"
      class="pl-0 pr-2"
    >
      <delegate-vote-checkbox :delegate="delegate" />
    </td>
  </tr>

  <!-- eslint-disable vue/no-multiple-template-root -->
  <tr
    v-if="detailsExpanded"
    :class="classes.details"
  >
    <td
      colspan="3"
      class="pa-0"
    >
      <delegate-details-expander
        :delegate="delegate"
      />
    </td>
  </tr>
  <!-- eslint-enable vue/no-multiple-template-root -->
</template>

<script>
import { computed, reactive } from 'vue'
import { useStore } from 'vuex'

import DelegateVoteCheckbox from '@/components/DelegatesTable/DelegateVoteCheckbox'
import DelegateDetailsExpander from '@/components/DelegatesTable/DelegateDetailsExpander'

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
  setup (props, { emit }) {
    const { delegate } = props
    const detailsExpanded = computed(() => props.detailsExpanded)

    const store = useStore()

    const className = 'delegates-table-item'
    const classes = {
      item: className,
      details: `${className}__details`,
      td: `${className}__td`
    }

    const delegateObj = reactive(() => delegate)
    const address = computed(() => delegate.address)
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
      delegateObj,
      address,
      username,
      rank,
      handleClick
    }
  }
}
</script>

<style lang="scss">
@import '~vuetify/settings';
@import '../../assets/styles/settings/_colors.scss';
@import '../../assets/styles/themes/adamant/_mixins.scss';

.delegates-table-item {

}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .delegates-table-item {
  }
}

.v-theme--light {
  .delegates-table-item {
    &__td {
      color: map-get($adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .delegates-table-item {
  }
}
</style>
