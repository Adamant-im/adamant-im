<template>
  <tr :class="classes.root">
    <td colspan="3">
      <v-alert :class="classes.alert" color="var(--a-color-text-muted-light)" :icon="mdiAlert">
        {{ t('votes.no_search_results', { query: searchQuery }) }}
      </v-alert>
    </td>
  </tr>
</template>

<script>
import { defineComponent } from 'vue'
import { mdiAlert } from '@mdi/js'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    searchQuery: {
      type: String,
      required: true
    }
  },
  setup() {
    const { t } = useI18n()
    const className = 'delegates-not-found'
    const classes = {
      root: className,
      alert: `${className}__alert`
    }

    return {
      t,
      classes,
      mdiAlert
    }
  }
})
</script>

<style lang="scss">
.delegates-not-found {
  &__alert {
    margin-block: var(--a-delegates-not-found-margin-block);
  }
}
</style>
